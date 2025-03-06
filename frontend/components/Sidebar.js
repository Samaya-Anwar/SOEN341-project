import React, { useState, useEffect } from "react";
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
