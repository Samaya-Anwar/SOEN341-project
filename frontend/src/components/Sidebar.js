import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { getPrivateChat } from "../api/get/getPrivateChats";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType = () => {} }) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
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

    return () => socket.off("channelUpdated");
  }, []);
  useEffect(() => {
    const fetchPrivateChats = async () => {
      try {
        const response = await getPrivateChat(userId);
        const conversationMap = {};
        response.forEach((msg) => {
          const partnerId =
            msg.senderID === userId ? msg.receiverID : msg.senderID;
          if (!conversationMap[partnerId]) {
            conversationMap[partnerId] = { partnerId, messages: [] };
          }
          conversationMap[partnerId].messages.push(msg);
        });
        setPrivateChats(Object.values(conversationMap));
      } catch (error) {
        console.error("Error fetching private chats:", error);
      }
    };
    fetchPrivateChats();
    socket.on("newPrivateMessage", (message) => {
      setPrivateChats((prevChats) => {
        const updatedChats = [...prevChats];
        const partnerId =
          message.senderId === userId ? message.receiverId : message.senderId;
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
    });
    return () => socket.off("newPrivateMessage");
  }, [userId]);

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

  const onDeleteChannel = async (channel) => {
    try {
      await deleteChannel(channel);
      socket.emit("channelUpdated"); // Notify users about channel deletion
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
  const handleSelectUser = (privateChatName) => {
    onSelectChat(privateChatName);
    onSelectChatType("dm");
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
      <Box>
        <Box sx={{ display: "flex", marginBottom: 2 }}>
          <Button
            onClick={() => setActiveTab("channels")}
            sx={{
              color: activeTab === "channels" ? "white" : "gray",
              fontWeight: activeTab === "channels" ? "bold" : "normal",
              borderBottom:
                activeTab === "channels" ? "2px solid white" : "none",
              borderRadius: 0,
              flexGrow: 1,
            }}
          >
            {" "}
            Channels
          </Button>
          <Button
            onClick={() => setActiveTab("dms")}
            sx={{
              color: activeTab === "dms" ? "white" : "gray",
              fontWeight: activeTab === "dms" ? "bold" : "normal",
              borderBottom: activeTab === "dms" ? "2px solid white" : "none",
              borderRadius: 0,
              flexGrow: 1,
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
              }}
            >
              <Typography variant="h6">Channels</Typography>
              {role === "admin" && (
                <Button
                  onClick={onCreateChannel}
                  sx={{ color: "lightblue", marginBottom: 1 }}
                >
                  + Add Channel
                </Button>
              )}
            </Box>
            <List>
              {channels.map((channel) => (
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
                      onClick={() => onDeleteChannel(channel.name)}
                      size="small"
                    >
                      Delete
                    </Button>
                  )}
                </ListItem>
              ))}
              {channels.length === 0 && (
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
        {activeTab === "dms" && (
          <>
            <Typography variant="h6">Direct Messages</Typography>
            <List>
              {privateChats.map((user) => (
                <ListItem
                  button
                  key={user.username}
                  onClick={() => handleSelectUser(user.username)}
                  sx={{
                    borderRadius: "4px",
                    "&:hover": { backgroundColor: "#40444b" },
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        user.status === "online" ? "green" : "gray",
                      marginRight: 2,
                    }}
                  />
                  <ListItemText
                    primary={user.username}
                    secondary={user.status || "offline"}
                    secondaryTypographyProps={{ sx: { color: "lightgrey" } }}
                  />
                </ListItem>
              ))}
              {privateChats.length === 0 && (
                <Typography
                  variant="body2"
                  color="gray"
                  sx={{ textAlign: "center", my: 2 }}
                >
                  No users available
                </Typography>
              )}
            </List>
          </>
        )}
      </Box>
      <Divider sx={{ backgroundColor: "gray", my: 2 }} />

      {/* User Info & Logout */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "green",
              marginRight: 2,
            }}
          />
          <Typography>{userId || "Anonymous"}</Typography>
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
