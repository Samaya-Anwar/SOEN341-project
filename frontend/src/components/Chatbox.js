import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { getMessages } from "../api/get/getMessages";
import { deleteMessage } from "../api/delete/deleteMessage";
import { io } from "socket.io-client";
import { sendMessage } from "../api/post/sendMessage";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

const socket = io(API_URL);

const Chatbox = ({ selectedChat }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const username = localStorage.getItem("username") || "Anonymous";
  const role = localStorage.getItem("role");

  // Load messages for the selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedChat) {
        try {
          const response = await getMessages(selectedChat);
          setMessages(response);
          socket.emit("joinChannel", selectedChat);
        } catch (error) {
          console.error("Error fetching messages:", error);
        }
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Listen for new messages & message deletions
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      if (newMessage.channel === selectedChat) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    const handleDeleteMessage = (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleteMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleteMessage);
    };
  }, [selectedChat]);

  // Send a message
  const onSendMessage = async () => {
    if (!input.trim()) return;

    const messageData = {
      sender: username,
      content: input,
      channel: selectedChat,
    };
    if (!username || !selectedChat) {
      console.error("Missing required message data:", messageData);
      return;
    }

    try {
      await sendMessage(messageData);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Handle Enter key to send message
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSendMessage();
    }
  };

  // Delete a message (Admins only)
  const onDeleteMessage = async (messageId) => {
    try {
      deleteMessage(messageId);
      socket.emit("deleteMessage", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <Box
      sx={{
        width: "75%",
        height: "100vh",
        backgroundColor: "#36393f",
        color: "white",
        padding: 2,
      }}
    >
      <Typography variant="h6" sx={{ marginBottom: 2 }}>
        {selectedChat || "Select a chat"}
      </Typography>
      <Box
        sx={{
          height: "80%",
          overflowY: "auto",
          backgroundColor: "#2f3136",
          padding: 2,
          borderRadius: 1,
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 1,
            }}
          >
            <Typography>
              <strong>{msg.sender}:</strong> {msg.content}
            </Typography>
            {role === "admin" && (
              <Button
                onClick={() => onDeleteMessage(msg._id)}
                sx={{ marginLeft: 1, color: "red" }}
              >
                Delete
              </Button>
            )}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", marginTop: 2 }}>
        <TextField
          variant="outlined"
          fullWidth
          placeholder="Type a message..."
          sx={{ backgroundColor: "white", borderRadius: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onSendMessage}
          sx={{ marginLeft: 1 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbox;
