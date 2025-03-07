/*import React, { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemText, TextField, Typography, Button } from "@mui/material";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const Sidebar = ({ onSelectChat }) => {
  const [search, setSearch] = useState("");
  const [channels, setChannels] = useState([]);
  const role = localStorage.getItem("role");

  useEffect(() => {
    axios.get("http://localhost:5001/api/channels").then((res) => setChannels(res.data));

    socket.on("channelUpdated", () => {
      axios.get("http://localhost:5001/api/channels").then((res) => setChannels(res.data));
    });

    return () => socket.off("channelUpdated");
  }, []);

  const createChannel = async () => {
    const channelName = prompt("Enter new channel name:");
    if (!channelName) return;

    try {
      await axios.post("http://localhost:5001/api/channels", { channel: channelName });
      socket.emit("channelUpdated"); // Notify users about new channel
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const deleteChannel = async (channel) => {
    try {
      await axios.delete(`http://localhost:5001/api/channels/${channel}`);
      socket.emit("channelUpdated"); // Notify users about channel deletion
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  return (
    <Box sx={{ width: "25%", height: "100vh", backgroundColor: "#2f3136", color: "white", padding: 2 }}>
      <Typography variant="h6">Channels</Typography>
      {role === "admin" && <Button onClick={createChannel} sx={{ color: "lightblue", marginBottom: 1 }}>+ Add Channel</Button>}
      <List>
        {channels.map((channel) => (
          <ListItem button key={channel.name} onClick={() => onSelectChat(channel.name)}>
            <ListItemText primary={channel.name} />
            {role === "admin" && (
              <Button color="error" onClick={() => deleteChannel(channel.name)}>Delete</Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
*/

import React, { useState, useEffect } from "react";
import { Box, List, ListItem, ListItemText, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom"; // **Added**
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const Sidebar = ({ onSelectChat }) => {
  const [channels, setChannels] = useState([]);
  const role = localStorage.getItem("role"); // **Getting the role from localStorage**
  const navigate = useNavigate(); // **Added** to navigate programmatically

  useEffect(() => {
    axios.get("http://localhost:5001/api/channels").then((res) => setChannels(res.data));

    socket.on("channelUpdated", () => {
      axios.get("http://localhost:5001/api/channels").then((res) => setChannels(res.data));
    });

    return () => socket.off("channelUpdated");
  }, []);

  const goToAdminDashboard = () => {
    navigate("/admin-dashboard"); // **Navigating to Admin Dashboard**
  };

  const createChannel = async () => {
    if (role !== "admin") return; // **Ensure only admins can create channels**

    const channelName = prompt("Enter new channel name:");
    if (!channelName) return;

    try {
      await axios.post("http://localhost:5001/api/channels", { channel: channelName });
      socket.emit("channelUpdated"); // Notify users about new channel
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const deleteChannel = async (channel) => {
    if (role !== "admin") return; // **Ensure only admins can delete channels**

    try {
      await axios.delete(`http://localhost:5001/api/channels/${channel}`);
      socket.emit("channelUpdated"); // Notify users about channel deletion
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  return (
    <Box sx={{ width: "25%", height: "100vh", backgroundColor: "#2f3136", color: "white", padding: 2 }}>
      <Typography variant="h6">Channels</Typography>

      {/* **Admin-only button to navigate to Admin Dashboard** */}
      {role === "admin" && (
        <Button 
        onClick={goToAdminDashboard} 
        variant="contained" 
        sx={{ 
          color: "white", 
          backgroundColor: "#4caf50", 
          "&:hover": { backgroundColor: "#45a049" }, 
          marginBottom: 2 
        }}
      >
        Go to Admin Dashboard
      </Button>
      )}

      {/* **Admin-only button to create a channel** */}
      {role === "admin" && (
        /*<Button 
          onClick={createChannel} 
          sx={{ color: "lightblue", marginBottom: 2 }}
        >
          + Add Channel
        </Button>*/
        <Button 
          onClick={createChannel} 
          sx={{
            color: "lightblue",
            backgroundColor: "transparent",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background 0.2s ease-in-out",
            "&:hover": { backgroundColor: "#3a3a3a", color: "white" },
            marginBottom: 2,
            textAlign: "left", // Align text like the channels
          }}
        >
  + Add Channel
</Button>

      )}

      {/* **THIS IS NEWWWWWW** */}
      <List>
        {channels.map((channel) => (
          <ListItem button key={channel.name} onClick={() => onSelectChat(channel.name)}
            sx={{
              borderRadius: "6px",
              cursor: "pointer",
              transition: "background 0.2s ease-in-out",
              backgroundColor: "transparent",
              "&:hover": { backgroundColor: "#40464b" }, // Normal hover effect
              position: "relative",
              "&:has(button:hover)": { backgroundColor: "transparent" },
            }}
          >
            <ListItemText primary={channel.name} />
            
            {/* **Admin-only button to delete a channel** */}
            {role === "admin" && (
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation(); // Prevents channel click when deleting
                  deleteChannel(channel.name);
                }}
                sx={{
                  color: "red",
                  backgroundColor: "transparent",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.2s ease-in-out",
                  "&:hover": { backgroundColor: "#1f1f1f" }, // Hover effect for delete button
                  position: "absolute",
                  right: "10px",
                }}
              >
                Delete
              </Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Sidebar;
