import React, { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Chatbox from "./Chatbox";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState("General"); // Default to General

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar onSelectChat={setSelectedChat} />
      <Chatbox selectedChat={selectedChat} />
    </Box>
  );
};

export default Chat;
