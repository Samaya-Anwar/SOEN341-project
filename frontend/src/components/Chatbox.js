import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Avatar } from "@mui/material";
import { getMessages } from "../api/get/getMessages";
import { deleteMessage } from "../api/delete/deleteMessage";
import { getPrivateChat } from "../api/get/getPrivateChat";
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

  const [recipient, setRecipient] = useState(null);

  const username = localStorage.getItem("username") || "Anonymous";
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSummary("");
  }, [selectedChat, chatType]);

  useEffect(() => {
    if (!selectedChat) return;
    if (chatType === "dm") {
      setRecipient(selectedChat);
      // Ensure consistent room naming
      const users = [userId, selectedChat._id].sort();
      const dmRoom = `dm_${users[0]}_${users[1]}`;

      console.log("Joining DM Room:", dmRoom);
      // Pass proper data structure to match backend expectations
      socket.emit("joinDM", { users: [userId, selectedChat._id] });
    } else if (chatType === "channel") {
      setRecipient(null);
      socket.emit("joinChannel", selectedChat);
    }
  }, [selectedChat, chatType, username, userId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        if (chatType === "dm") {
          const response = await getPrivateChat();
          console.log("Fetched private messages:", response);
          // Filter for conversations with the selected user
          const conversation = response.filter(
            (msg) =>
              (msg.senderId === selectedChat._id &&
                msg.receiverId === userId) ||
              (msg.senderId === userId && msg.receiverId === selectedChat._id)
          );
          setMessages(conversation);
        } else {
          const response = await getMessages(selectedChat);
          setMessages(response);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedChat, chatType, username, userId]);

  // Listen for new messages & message deletions
  useEffect(() => {
    const handleNewMessage = (msg) => {
      console.log("Received message:", msg);
      console.log("Current chat type:", chatType);
      console.log("Selected chat:", selectedChat);

      if (chatType === "dm" && selectedChat) {
        console.log("DM message received:", {
          msgSenderId: msg.senderId,
          msgReceiverId: msg.receiverId,
          selectedId: selectedChat._id,
          myId: userId,
        });

        // Check if this message belongs to the current conversation
        if (
          (msg.senderId === selectedChat._id && msg.receiverId === userId) ||
          (msg.senderId === userId && msg.receiverId === selectedChat._id)
        ) {
          console.log("Adding message to conversation");
          setMessages((prev) => [...prev, msg]);
        }
      } else if (chatType === "channel" && msg.channel === selectedChat) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleDeleteMessage = (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg._id !== messageId)
      );
    };

    const handleTyping = (data) => {
      if (
        (chatType === "dm" && data.sender === recipient?.username) ||
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
  }, [selectedChat, chatType, username, recipient, userId]);

  const handleTypingIndication = () => {
    if (chatType === "dm" && recipient) {
      socket.emit("typing", {
        sender: username,
        recipient: recipient.username,
      });
    } else if (chatType === "channel") {
      socket.emit("typing", {
        sender: username,
        channel: selectedChat,
      });
    }
  };

  const onSendMessage = async () => {
    if (!input.trim() || !selectedChat) return;

    try {
      if (chatType === "dm") {
        const messageData = {
          senderId: userId,
          receiverId: selectedChat._id,
          content: input,
          sender: username, // Add sender name for display
          timestamp: new Date(),
        };

        console.log("Sending DM:", messageData);

        // Save to database via API (do this first to ensure persistence)
        const response = await sendMessage(messageData);
        console.log("Message sent response:", response);

        // If the API was successful, then emit via socket
        if (response && response._id) {
          // Use the saved message from DB (which includes the _id)
          socket.emit("sendDirectMessage", response);

          // Add to local messages with the DB-assigned _id
          setMessages((prev) => [...prev, response]);
        } else {
          // If no response but no error thrown, use local data
          setMessages((prev) => [...prev, messageData]);
        }
      } else {
        const messageData = {
          sender: username,
          content: input,
          channel: selectedChat,
          timestamp: new Date(),
        };

        const response = await sendMessage(messageData);
        setMessages((prev) => [...prev, response || messageData]);
      }

      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
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
      await deleteMessage(messageId);
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
    if (selectedChat.username) {
      return `${selectedChat.username}`;
    }
    return `#${selectedChat}`;
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
              backgroundColor:
                msg.sender === username || msg.senderId === userId
                  ? "#40444b"
                  : "#2f3136",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-start" }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  marginRight: 1,
                  bgcolor:
                    msg.sender === username || msg.senderId === userId
                      ? "#5865f2"
                      : "#ed4245",
                }}
              >
                {/* Handle different message formats safely */}
                {msg.sender
                  ? msg.sender.charAt(0).toUpperCase()
                  : msg.senderId === userId
                  ? username.charAt(0).toUpperCase()
                  : "?"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" color="lightgrey">
                  {msg.sender || (msg.senderId === userId ? username : "User")}{" "}
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
            {chatType === "dm" ? recipient?.username : "Someone"} is typing...
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
            chatType === "dm" ? recipient?.username : "#" + selectedChat
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
