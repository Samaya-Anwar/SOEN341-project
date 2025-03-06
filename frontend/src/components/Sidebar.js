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
        <Button 
          onClick={createChannel} 
          sx={{ color: "lightblue", marginBottom: 2 }}
        >
          + Add Channel
        </Button>
      )}

      <List>
        {channels.map((channel) => (
          <ListItem button key={channel.name} onClick={() => onSelectChat(channel.name)}>
            <ListItemText primary={channel.name} />
            
            {/* **Admin-only button to delete a channel** */}
            {role === "admin" && (
              <Button 
                color="error" 
                onClick={() => deleteChannel(channel.name)} 
                sx={{ marginLeft: 2 }}
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
