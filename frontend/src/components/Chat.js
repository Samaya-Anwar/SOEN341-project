import React, { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Chatbox from "./Chatbox";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState("channel"); // "channel" or "dm"

  const handleSelectChat = (chatId) => {
    setSelectedChat(chatId);
  };

  const handleSelectChatType = (type) => {
    setChatType(type);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar
        onSelectChat={handleSelectChat}
        onSelectChatType={handleSelectChatType}
      />
      <Chatbox selectedChat={selectedChat} chatType={chatType} />
    </Box>
  );
};

export default Chat;
