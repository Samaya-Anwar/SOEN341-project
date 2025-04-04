import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  TextField,
  Button,
  Divider,
  Avatar,
} from "@mui/material";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { createPrivateChat } from "../api/post/createPrivateChat";
import { getPrivateChat } from "../api/get/getPrivateChats";
import { deletePrivateChat } from "../api/delete/deletePrivateChat";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../api/get/getUsers";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType = () => {} }) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [searchQuery, setSearchQuery] = useState("");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchPrivateChats = async () => {
      try {
        const response = await getPrivateChat();
        console.log("Fetched private chats:", response);
        setPrivateChats(response);
      } catch (error) {
        console.error("Error fetching private chats:", error);
        setPrivateChats([]);
      }
    };

    if (username) {
      fetchPrivateChats();
    }
    socket.on("privateChatUpdated", fetchPrivateChats);
    return () => socket.off("privateChatUpdated", fetchPrivateChats);
  }, [username]);

  useEffect(() => {
    const handleNewPrivateMessage = (message) => {
      setPrivateChats((prevChats) => {
        const updatedChats = [...prevChats];
        const partnerId =
          message.senderId === username ? message.receiverId : message.senderId;
        const existingChatIndex = updatedChats.findIndex(
          (chat) => chat.partnerId === partnerId
        );
        if (existingChatIndex !== -1) {
          updatedChats[existingChatIndex].messages.push(message);
        } else {
          updatedChats.push({ partnerId, messages: [message] });
        }
        return updatedChats;
      });
    };

    socket.on("newPrivateMessage", handleNewPrivateMessage);
    return () => socket.off("newPrivateMessage", handleNewPrivateMessage);
  }, [username]);

  const combinedChats = useMemo(() => {
    if (!Array.isArray(privateChats)) return [];
    return privateChats.map((chat) => {
      const partnerUsername = chat.participants.find((p) => p !== username);
      return {
        chatId: chat._id,
        partnerId: partnerUsername,
        username: partnerUsername || "Unknown",
        messages: chat.messages || [],
      };
    });
  }, [privateChats, username]);

  const filteredChannels = channels.filter((channel) =>
    (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivateChats = useMemo(() => {
    return combinedChats.filter((chat) =>
      chat.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedChats, searchQuery]);

  const onCreatePrivateChat = async (partnerUsername) => {
    const exists = combinedChats.find(
      (chat) => chat.username.toLowerCase() === partnerUsername.toLowerCase()
    );
    if (exists) {
      onSelectChat({ username: partnerUsername, chatId: exists.chatId });
      onSelectChatType("privateChat");
      return;
    }
    try {
      const response = await createPrivateChat({
        participants: [username, partnerUsername],
      });

      console.log("New private chat created:", response.data);

      socket.emit("privateChatUpdated");
      if (response?.data?._id) {
        onSelectChat({ username: partnerUsername, chatId: response.data._id });
        onSelectChatType("privateChat");
      } else {
        console.error("No chat ID returned in response:", response);
      }
    } catch (error) {
      console.error("Error starting new private chat:", error);
    }
  };
  const onDeletePrivateChat = async (chatId) => {
    try {
      await deletePrivateChat(chatId);
      socket.emit("privateChatUpdated");
    } catch (error) {
      console.error("Error deleting private chat:", error);
    }
  };

  const onCreateChannel = async () => {
    const channelName = prompt("Enter new channel name:");
    if (!channelName) return;

    try {
      await createChannel(channelName);
      socket.emit("channelUpdated");
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const onDeleteChannel = async (channel) => {
    try {
      await deleteChannel(channel);
      socket.emit("channelUpdated");
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    navigate("/login");
  };
  const handleSelectChannel = (channelName) => {
    onSelectChat(channelName);
    onSelectChatType("channel");
  };
  const handleSelectPrivateChat = (chat) => {
    onSelectChat(chat);
    onSelectChatType("privateChat");
  };

  return (
    <Box
      sx={{
        width: "25%",
        height: "100vh",
        backgroundColor: "#2f3136",
        color: "white",
        padding: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <TextField
        fullWidth
        placeholder="Search channels and private chats..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2, backgroundColor: "white", borderRadius: 1 }}
      />
      <Box>
        <Box sx={{ display: "flex", marginBottom: 2 }}>
          <Button
            onClick={() => {
              setActiveTab("channels");
              onSelectChatType("channel");
            }}
            sx={{
              color: activeTab === "channels" ? "white" : "gray",
              fontWeight: activeTab === "channels" ? "bold" : "normal",
              borderBottom:
                activeTab === "channels" ? "2px solid white" : "none",
              borderRadius: 0,
              flexGrow: 1,
            }}
          >
            Channels
          </Button>
          <Button
            onClick={() => {
              setActiveTab("privateChats");
              onSelectChatType("privateChat");
            }}
            sx={{
              color: activeTab === "privateChats" ? "white" : "gray",
              flexGrow: 1,
            }}
          >
            Private Chats
          </Button>
        </Box>
        {activeTab === "channels" && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Channels</Typography>
              {role === "admin" && (
                <Button
                  onClick={onCreateChannel}
                  sx={{ color: "lightblue", mb: 1 }}
                >
                  + Add Channel
                </Button>
              )}
            </Box>
            <List>
              {filteredChannels.map((channel) => (
                <ListItem
                  button
                  key={channel.name}
                  onClick={() => handleSelectChannel(channel.name)}
                  sx={{
                    borderRadius: "4px",
                    "&:hover": { backgroundColor: "#40444b" },
                  }}
                >
                  <ListItemText primary={channel.name} />
                  {role === "admin" && (
                    <Button
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChannel(channel.name);
                      }}
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </ListItem>
              ))}
              {filteredChannels.length === 0 && (
                <Typography
                  variant="body2"
                  color="gray"
                  sx={{ textAlign: "center", my: 2 }}
                >
                  No channels available
                </Typography>
              )}
            </List>
          </>
        )}
        {activeTab === "privateChats" && (
          <>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Private Chats</Typography>
              <Button
                onClick={() => {
                  const usernameToChat = prompt(
                    "Enter username to start chat with:"
                  );
                  if (usernameToChat !== null && usernameToChat.trim() !== "") {
                    onCreatePrivateChat(usernameToChat.trim());
                  } else {
                    alert("No username entered.");
                  }
                }}
                sx={{ color: "lightblue" }}
              >
                + New Chat
              </Button>
            </Box>
            <List>
              {filteredPrivateChats.map((chat) => (
                <ListItem
                  button
                  key={chat.partnerId}
                  onClick={() => handleSelectPrivateChat(chat)}
                  sx={{
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "#40444b" },
                  }}
                >
                  <ListItemText
                    primary={chat.username}
                    secondary={
                      chat.messages && chat.messages.length > 0
                        ? chat.messages[chat.messages.length - 1].content
                        : "New Conversation"
                    }
                  />
                  <Button
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePrivateChat(chat.chatId);
                    }}
                    size="small"
                  >
                    Delete
                  </Button>
                </ListItem>
              ))}
              {filteredPrivateChats.length === 0 && (
                <Typography
                  variant="body2"
                  color="gray"
                  sx={{ textAlign: "center", my: 2 }}
                >
                  No private chats found
                </Typography>
              )}
            </List>
          </>
        )}
      </Box>
      <Divider sx={{ backgroundColor: "gray", my: 2 }} />

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
            {username ? username.charAt(0).toUpperCase() : "A"}
          </Avatar>
          <Typography>{username || "Anonymous"}</Typography>
        </Box>
        <Button
          onClick={handleLogout}
          sx={{
            color: "white",
            backgroundColor: "red",
            "&:hover": { backgroundColor: "darkred" },
            width: "100%",
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
