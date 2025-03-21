import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import { getMessages } from "../api/get/getMessages";
import { deleteMessage } from "../api/delete/deleteMessage";
import { io } from "socket.io-client";
import { sendMessage } from "../api/post/sendMessage";
import { getChatSummary } from "../api/get/getChatSummary";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

const socket = io(API_URL);

const Chatbox = ({ selectedChat, chatType }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [recipient, setRecipient] = useState(null);

  const username = localStorage.getItem("username") || "Anonymous";
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (chatType === "dm" && selectedChat) {
      setRecipient(selectedChat);
      const users = [username, selectedChat].sort();
      const dmRoom = `dm_${users[0]}_${users[1]}`;
      socket.emit("joinDM", dmRoom);
    } else if (chatType === "channel" && selectedChat) {
      setRecipient(null);
      socket.emit("joinChannel", selectedChat);
    }
  }, [selectedChat, chatType, username]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        let response;
        if (chatType === "dm") {
          // For DMs, we need to provide both participants
          const users = [username, selectedChat].sort();
          const dmRoom = `dm_${users[0]}_${users[1]}`;
          response = await getMessages(dmRoom, "dm");
        } else {
          // For channels
          response = await getMessages(selectedChat, "channel");
        }

        setMessages(response);
      } catch (error) {
        console.error(`Error fetching ${chatType} messages:`, error);
      }
    };

    fetchMessages();
  }, [selectedChat, chatType, username]);

  // Listen for new messages & message deletions
  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const isDMForMe =
        chatType === "dm" &&
        ((newMessage.sender === recipient &&
          newMessage.recipient === username) ||
          (newMessage.sender === username &&
            newMessage.recipient === recipient));

      const isChannelMessage =
        chatType === "channel" && newMessage.channel === selectedChat;

      if (isDMForMe || isChannelMessage) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    };

    const handleDeleteMessage = (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    };

    const handleTyping = (data) => {
      if (
        (chatType === "dm" && data.sender === recipient) ||
        (chatType === "channel" && data.channel === selectedChat)
      ) {
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageDeleted", handleDeleteMessage);
    socket.on("userTyping", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageDeleted", handleDeleteMessage);
      socket.off("userTyping", handleTyping);
    };
  }, [selectedChat, chatType, username, recipient]);

  const handleTypingIndication = () => {
    if (typingTimeout) clearTimeout(typingTimeout);

    if (chatType === "dm") {
      // For DMs, emit typing to the specific user
      socket.emit("typing", { sender: username, recipient: recipient });
    } else {
      // For channels
      socket.emit("typing", { sender: username, channel: selectedChat });
    }

    // Set a timeout to prevent too many typing events
    setTypingTimeout(
      setTimeout(() => {
        setTypingTimeout(null);
      }, 2000)
    );
  };

  const onSendMessage = async () => {
    if (!input.trim() || !selectedChat) return;

    let messageData;

    if (chatType === "dm") {
      messageData = {
        sender: username,
        content: input,
        recipient: recipient,
        type: "dm",
      };
    } else {
      messageData = {
        sender: username,
        content: input,
        channel: selectedChat,
        type: "channel",
      };
    }
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
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSendMessage();
    } else {
      handleTypingIndication();
    }
  };

  const onDeleteMessage = async (messageId) => {
    try {
      deleteMessage(messageId);
      socket.emit("deleteMessage", messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };
  const onSummarize = async () => {
    if (!selectedChat) return;

    try {
      const data = await getChatSummary(selectedChat);
      setSummary(data.summary || "No summary available.");
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Could not generate summary.");
    }
  };
  const getChatTitle = () => {
    if (!selectedChat) return "Select a chat";

    if (chatType === "dm") {
      return `Direct message with ${selectedChat}`;
    } else {
      return `#${selectedChat}`;
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
        {getChatTitle()}
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 1,
              padding: 1,
              borderRadius: 1,
              backgroundColor: msg.sender === username ? "#40444b" : "#2f3136",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  marginRight: 1,
                  bgcolor: msg.sender === username ? "#5865f2" : "#ed4245",
                }}
              >
                {msg.sender.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="lightgrey">
                  {msg.sender}{" "}
                  {msg.timestamp &&
                    new Date(msg.timestamp).toLocaleTimeString()}
                </Typography>
                <Typography>{msg.content}</Typography>
              </Box>
            </Box>
            {role === "admin" && (
              <Button
                onClick={() => onDeleteMessage(msg._id)}
                sx={{ color: "red" }}
                size="small"
              >
                Delete
              </Button>
            )}
          </Box>
        ))}
        {typing && (
          <Typography variant="body2" color="lightgrey" fontStyle="italic">
            {chatType === "dm" ? recipient : "Someone"} is typing...
          </Typography>
        )}
      </Box>

      <Box sx={{ marginBottom: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onSummarize}
          sx={{ marginRight: 2 }}
        >
          Summarize
        </Button>
        {summary && (
          <Box
            sx={{
              marginTop: 2,
              backgroundColor: "#2f3136",
              padding: 2,
              borderRadius: 1,
            }}
          >
            <Typography variant="body1">{summary}</Typography>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setSummary("")}
              sx={{ marginTop: 1 }}
            >
              Close
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", marginTop: 2 }}>
        <TextField
          variant="outlined"
          fullWidth
          placeholder={`Message ${
            chatType === "dm" ? recipient : "#" + selectedChat
          }...`}
          sx={{ backgroundColor: "white", borderRadius: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!selectedChat}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={onSendMessage}
          sx={{ marginLeft: 1 }}
          disabled={!input.trim() || !selectedChat}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbox;
