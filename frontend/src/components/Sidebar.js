import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
} from "@mui/material";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat }) => {
  const [channels, setChannels] = useState([]);
  const role = localStorage.getItem("role");

  useEffect(() => {
    const response = getChannels();
    setChannels(response.data);

    socket.on("channelUpdated", () => {
      const response = getChannels();
      setChannels(response.data);
    });

    return () => socket.off("channelUpdated");
  }, []);

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

  return (
    <Box
      sx={{
        width: "25%",
        height: "100vh",
        backgroundColor: "#2f3136",
        color: "white",
        padding: 2,
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
      <List>
        {channels.map((channel) => (
          <ListItem
            button
            key={channel.name}
            onClick={() => onSelectChat(channel.name)}
          >
            <ListItemText primary={channel.name} />
            {role === "admin" && (
              <Button
                color="error"
                onClick={() => onDeleteChannel(channel.name)}
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
