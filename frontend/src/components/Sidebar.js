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
import { useNavigate } from "react-router-dom";
import { getChannels } from "../api/get/getChannels";
import { createChannel } from "../api/post/createChannel";
import { deleteChannel } from "../api/delete/deleteChannel";
import { getUsers } from "../api/get/getUsers.js";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType }) => {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("channels"); // "channels" or "dms"

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

    return () => socket.off("channelUpdated");
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        // Filter out current user
        setUsers(response.filter((user) => user.username !== username));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
    socket.on("userStatusChanged", fetchUsers);

    return () => socket.off("userStatusChanged");
  }, [username]);

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

  const handleSelectUser = (userName) => {
    onSelectChat(userName);
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
        {/* Tabs for Channels and DMs */}
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

        {/* Channels Tab Content */}
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
                <Button onClick={onCreateChannel} sx={{ color: "lightblue" }}>
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
                  <ListItemText primary={`# ${channel.name}`} />
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

        {/* Direct Messages Tab Content */}
        {activeTab === "dms" && (
          <>
            <Typography variant="h6">Direct Messages</Typography>
            <List>
              {users.map((user) => (
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
              {users.length === 0 && (
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
