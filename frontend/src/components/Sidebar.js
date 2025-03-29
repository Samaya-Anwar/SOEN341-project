import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Button,
  Divider,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { sendMessage } from "../api/post/sendMessage";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { getPrivateChat } from "../api/get/getPrivateChat";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../api/get/getUsers";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType = () => {} }) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  // Fetch channels
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await getChannels();
        setChannels(response);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();

    socket.on("channelUpdated", fetchChannels);

    return () => socket.off("channelUpdated", fetchChannels);
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Define fetchPrivateChats with useCallback
  const fetchPrivateChats = useCallback(async () => {
    if (!userId) return;

    try {
      console.log("Fetching private chats for user:", userId);
      const response = await getPrivateChat();
      console.log("Private chat API response:", response);

      if (!response || response.length === 0) {
        console.log("No private messages found");
        return;
      }

      const usersResponse = await getUsers();
      const conversationMap = {};

      response.forEach((msg) => {
        // Determine which user is the conversation partner
        const partnerId =
          msg.senderId === userId ? msg.receiverId : msg.senderId;

        // Find the partner's details from users list
        const partnerDetails = usersResponse.find(
          (user) => user._id === partnerId
        );

        // Initialize conversation if this is the first message with this partner
        if (!conversationMap[partnerId]) {
          conversationMap[partnerId] = {
            partnerId,
            username: partnerDetails?.username || "Unknown User",
            messages: [],
          };
        }

        // Add message to the conversation
        conversationMap[partnerId].messages.push(msg);
      });

      console.log("Processed conversation map:", conversationMap);
      setPrivateChats(Object.values(conversationMap));
    } catch (error) {
      console.error("Error fetching private chats:", error);
    }
  }, [userId]);

  // Initial fetch of private chats
  useEffect(() => {
    fetchPrivateChats();

    // Also fetch when socket indicates an update
    socket.on("privateChatUpdated", fetchPrivateChats);

    return () => socket.off("privateChatUpdated", fetchPrivateChats);
  }, [fetchPrivateChats]);

  // Listen for new messages
  useEffect(() => {
    const handleNewPrivateMessage = (message) => {
      console.log("New private message received:", message);

      // Check if this message is related to the current user
      if (message.senderId === userId || message.receiverId === userId) {
        console.log("Message relevant to current user, updating chats");

        // Determine the conversation partner
        const partnerId =
          message.senderId === userId ? message.receiverId : message.senderId;

        setPrivateChats((prevChats) => {
          // Find if we already have a conversation with this partner
          const existingChatIndex = prevChats.findIndex(
            (chat) => chat.partnerId === partnerId
          );

          if (existingChatIndex !== -1) {
            // Update existing conversation
            const updatedChats = [...prevChats];
            updatedChats[existingChatIndex].messages.push(message);
            return updatedChats;
          } else {
            // Start a new conversation
            // Find partner details from users list
            const partnerDetails = users.find((user) => user._id === partnerId);
            return [
              ...prevChats,
              {
                partnerId,
                username: partnerDetails?.username || "Unknown User",
                messages: [message],
              },
            ];
          }
        });

        // Also fetch the entire list to ensure everything is up to date
        fetchPrivateChats();
      }
    };

    socket.on("newMessage", handleNewPrivateMessage);
    return () => socket.off("newMessage", handleNewPrivateMessage);
  }, [userId, users, fetchPrivateChats]);

  // Combine users with their conversations
  const combinedDMs = useMemo(() => {
    console.log("Building combinedDMs with:", { users, privateChats });

    return users
      .filter((user) => user._id !== userId) // Filter out current user
      .map((user) => {
        // Find any conversation with this user
        const conversation = privateChats.find(
          (chat) => chat.partnerId === user._id
        );

        return { ...user, conversation };
      });
  }, [users, privateChats, userId]);

  // Filtered channels based on search
  const filteredChannels = channels.filter((channel) =>
    (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered DMs based on search
  const filteredDMs = useMemo(() => {
    if (!searchQuery.trim()) {
      // If no search, show only users with conversations
      const result = combinedDMs.filter((user) => user.conversation);
      console.log("Filtered DMs (no search):", result);
      return result;
    } else {
      // If searching, show all users matching the query
      const result = combinedDMs.filter((user) =>
        (user.username || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log("Filtered DMs (with search):", result);
      return result;
    }
  }, [combinedDMs, searchQuery]);

  // Create a new channel
  const onCreateChannel = async () => {
    const channelName = prompt("Enter new channel name:");
    if (!channelName) return;

    try {
      await createChannel(channelName);
      socket.emit("channelUpdated"); // Notify users about new channel
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  // Create a new private chat
  const onCreatePrivateChat = async (user) => {
    if (!user) return;

    console.log("Creating new private chat with:", user);

    // Create an initial message to start the conversation
    try {
      const messageData = {
        senderId: userId,
        receiverId: user._id,
        content: "Hello!",
        sender: username, // Add sender name for display
        timestamp: new Date(),
      };

      console.log("Sending initial DM:", messageData);

      // Save via API first for persistence
      const response = await sendMessage(messageData);
      console.log("API response for new message:", response);

      // Emit via socket.io if we got a valid response
      if (response && response._id) {
        socket.emit("sendDirectMessage", response);
      } else {
        socket.emit("sendDirectMessage", messageData);
      }

      // Signal update
      socket.emit("privateChatUpdated");

      // Manually add this message to our state
      setPrivateChats((prevChats) => {
        // Check if we already have a conversation with this user
        const existingChat = prevChats.find(
          (chat) => chat.partnerId === user._id
        );

        if (existingChat) {
          // Update existing conversation
          return prevChats.map((chat) =>
            chat.partnerId === user._id
              ? {
                  ...chat,
                  messages: [...chat.messages, response || messageData],
                }
              : chat
          );
        } else {
          // Create new conversation
          return [
            ...prevChats,
            {
              partnerId: user._id,
              username: user.username,
              messages: [response || messageData],
            },
          ];
        }
      });
    } catch (error) {
      console.error("Error creating private chat:", error);
    }
  };

  // Delete channel
  const onDeleteChannel = async (channel) => {
    try {
      await deleteChannel(channel);
      socket.emit("channelUpdated"); // Notify users about channel deletion
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    navigate("/login");
  };

  // Handle channel selection
  const handleSelectChannel = (channelName) => {
    onSelectChat(channelName);
    onSelectChatType("channel");
  };

  // Handle DM selection
  const handleSelectDM = async (user) => {
    console.log("Selecting DM with user:", user);

    // Check if a conversation already exists for this user
    const existingConversation = combinedDMs.find(
      (u) => u._id === user._id
    )?.conversation;

    console.log("Existing conversation:", existingConversation);

    if (!existingConversation) {
      console.log("No existing conversation, creating one");
      // Create a new private chat if no conversation exists
      await onCreatePrivateChat(user);
    }

    // Now select the DM
    onSelectChat(user);
    onSelectChatType("dm");
  };

  // Connect to socket on component mount
  useEffect(() => {
    // Join user's personal socket room for direct notifications
    if (userId) {
      socket.emit("userConnected", userId);
    }

    return () => {
      socket.off();
    };
  }, [userId]);

  return (
    <Box
      sx={{
        width: "25%",
        height: "100vh",
        backgroundColor: "#1a1c26",
        color: "#e4e6eb",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "'Inter', sans-serif",
        borderRight: "1px solid #2a2d3e",
      }}
    >
      <TextField
        fullWidth
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#262938",
            borderRadius: "8px",
            color: "#e4e6eb",
            "&:hover fieldset": {
              borderColor: "#6366f1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#6366f1",
            },
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2a2d3e",
          },
          "& .MuiInputLabel-root": {
            color: "#a0aec0",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: "#a0aec0" }} />
            </InputAdornment>
          ),
        }}
      />
      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <Box sx={{ display: "flex", marginBottom: 3 }}>
          <Button
            onClick={() => {
              setActiveTab("channels");
              onSelectChatType("channel");
            }}
            sx={{
              color: activeTab === "channels" ? "#6366f1" : "#a0aec0",
              fontWeight: activeTab === "channels" ? 600 : 400,
              borderBottom:
                activeTab === "channels" ? "2px solid #6366f1" : "none",
              borderRadius: "4px 4px 0 0",
              flexGrow: 1,
              textTransform: "none",
              fontSize: "0.95rem",
              paddingBottom: "0.5rem",
              "&:hover": {
                backgroundColor: "transparent",
                color: activeTab === "channels" ? "#6366f1" : "#e4e6eb",
              },
            }}
          >
            Channels
          </Button>
          <Button
            onClick={() => {
              setActiveTab("dms");
              onSelectChatType("dm");
            }}
            sx={{
              color: activeTab === "dms" ? "#6366f1" : "#a0aec0",
              fontWeight: activeTab === "dms" ? 600 : 400,
              borderBottom: activeTab === "dms" ? "2px solid #6366f1" : "none",
              borderRadius: "4px 4px 0 0",
              flexGrow: 1,
              textTransform: "none",
              fontSize: "0.95rem",
              paddingBottom: "0.5rem",
              "&:hover": {
                backgroundColor: "transparent",
                color: activeTab === "dms" ? "#6366f1" : "#e4e6eb",
              },
            }}
          >
            Direct Messages
          </Button>
        </Box>

        {activeTab === "channels" && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#e4e6eb",
                  fontSize: "0.9rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Channels
              </Typography>
              {role === "admin" && (
                <Button
                  onClick={onCreateChannel}
                  sx={{
                    minWidth: "32px",
                    width: "32px",
                    height: "32px",
                    padding: 0,
                    borderRadius: "8px",
                    backgroundColor: "#333748",
                    color: "#6366f1",
                    "&:hover": {
                      backgroundColor: "#3e4259",
                    },
                  }}
                >
                  <AddIcon fontSize="small" />
                </Button>
              )}
            </Box>
            <List sx={{ padding: 0 }}>
              {filteredChannels.map((channel) => (
                <ListItem
                  button
                  key={channel.name}
                  onClick={() => handleSelectChannel(channel.name)}
                  sx={{
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "4px",
                    "&:hover": { backgroundColor: "#262938" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.95rem",
                        }}
                      >
                        # {channel.name}
                      </Typography>
                    }
                  />
                  {role === "admin" && (
                    <Button
                      sx={{
                        minWidth: "32px",
                        width: "32px",
                        height: "32px",
                        padding: 0,
                        borderRadius: "8px",
                        color: "#a0aec0",
                        "&:hover": {
                          backgroundColor: "#3e4259",
                          color: "#f56565",
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChannel(channel.name);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </Button>
                  )}
                </ListItem>
              ))}
              {channels.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    my: 3,
                    color: "#a0aec0",
                    fontStyle: "italic",
                  }}
                >
                  No channels available
                </Typography>
              )}
            </List>
          </>
        )}

        {activeTab === "dms" && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 2,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#e4e6eb",
                  fontSize: "0.9rem",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                Direct Messages
              </Typography>
              <Button
                onClick={() => setSearchQuery("")}
                sx={{
                  color: "#6366f1",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: "#818cf8",
                  },
                }}
              >
                {searchQuery ? "Show All" : "Find User"}
              </Button>
            </Box>
            <List sx={{ padding: 0 }}>
              {filteredDMs.map((user) => (
                <ListItem
                  button
                  key={user._id}
                  onClick={() => handleSelectDM(user)}
                  sx={{
                    borderRadius: "8px",
                    padding: "10px 12px",
                    marginBottom: "4px",
                    "&:hover": { backgroundColor: "#262938" },
                    backgroundColor: user.conversation
                      ? "transparent"
                      : "#262938",
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor:
                              user.status === "online" ? "#10b981" : "#a0aec0",
                            marginRight: 1.5,
                          }}
                        />
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.95rem",
                          }}
                        >
                          {user.username}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      user.conversation &&
                      user.conversation.messages.length > 0 ? (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: "#a0aec0",
                            fontSize: "0.8rem",
                            marginLeft: "16px",
                          }}
                        >
                          {user.conversation.messages[
                            user.conversation.messages.length - 1
                          ].content.length > 20
                            ? user.conversation.messages[
                                user.conversation.messages.length - 1
                              ].content.substring(0, 20) + "..."
                            : user.conversation.messages[
                                user.conversation.messages.length - 1
                              ].content}
                        </Typography>
                      ) : (
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            color: "#64748b",
                            fontStyle: "italic",
                            fontSize: "0.8rem",
                            marginLeft: "16px",
                          }}
                        >
                          Start a conversation
                        </Typography>
                      )
                    }
                  />
                </ListItem>
              ))}
              {!searchQuery && filteredDMs.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    my: 3,
                    color: "#a0aec0",
                    fontStyle: "italic",
                  }}
                >
                  No direct messages yet
                </Typography>
              )}
              {searchQuery && filteredDMs.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: "center",
                    my: 3,
                    color: "#a0aec0",
                    fontStyle: "italic",
                  }}
                >
                  No users matching "{searchQuery}"
                </Typography>
              )}
            </List>
          </>
        )}
      </Box>

      <Divider sx={{ backgroundColor: "#2a2d3e", my: 2 }} />

      {/* User Info & Logout */}
      <Box
        sx={{
          backgroundColor: "#262938",
          borderRadius: "8px",
          padding: "12px 16px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 1.5,
              fontWeight: "bold",
              color: "white",
            }}
          >
            {username ? username.charAt(0).toUpperCase() : "A"}
          </Box>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "0.95rem",
            }}
          >
            {username || "Anonymous"}
          </Typography>
        </Box>
        <Button
          onClick={handleLogout}
          variant="contained"
          startIcon={<LogoutIcon />}
          sx={{
            color: "white",
            backgroundColor: "#f43f5e",
            fontWeight: 500,
            borderRadius: "8px",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#e11d48",
            },
            width: "100%",
            py: 1,
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
