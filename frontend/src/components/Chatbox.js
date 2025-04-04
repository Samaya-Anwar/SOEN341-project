import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { getMessages } from "../api/get/getMessages";
import { deleteMessage } from "../api/delete/deleteMessage";
import { sendMessage } from "../api/post/sendMessage";
import { getChatSummary } from "../api/get/getChatSummary";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(API_URL);

const Chatbox = ({ selectedChat, chatType }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [typing, setTyping] = useState(false);

  const username = localStorage.getItem("username") || "Anonymous";
  const role = localStorage.getItem("role");

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSummary("");
  }, [selectedChat, chatType]);

  const privateChatId = useMemo(() => {
    return chatType === "privateChat" && selectedChat && selectedChat.username
      ? `privateChat_${[username, selectedChat.username].sort().join("_")}`
      : null;
  }, [chatType, selectedChat, username]);

  useEffect(() => {
    if (!selectedChat) return;
    if (chatType === "privateChat") {
      socket.emit("joinPrivateChat", privateChatId);
    } else if (chatType === "channel") {
      socket.emit("joinChannel", selectedChat);
    }
  }, [selectedChat, chatType, username, privateChatId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        const conversationId =
          chatType === "privateChat" ? privateChatId : selectedChat;
        const response = await getMessages(conversationId);
        setMessages(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error(`Error fetching ${chatType} messages:`, error);
      }
    };
    fetchMessages();
  }, [selectedChat, chatType, username, privateChatId]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const conversationId =
        chatType === "privateChat" ? privateChatId : selectedChat;
      if (newMessage.channel === conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };
    const handleDeleteMessage = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };
    const handleTyping = (data) => {
      if (
        (chatType === "privateChat" && data.channel === privateChatId) ||
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
  }, [selectedChat, chatType, username, privateChatId]);

  const handleTypingIndication = () => {
    if (chatType === "privateChat") {
      socket.emit("typing", { sender: username, channel: privateChatId });
    } else {
      socket.emit("typing", { sender: username, channel: selectedChat });
    }
  };

  const onSendMessage = async () => {
    if (!input.trim() || !selectedChat) return;
    let messageData;
    const channel = chatType === "privateChat" ? privateChatId : selectedChat;
    if (chatType === "privateChat") {
      messageData = {
        sender: username,
        content: input,
        channel,
        type: "privateChat",
      };
    } else {
      messageData = {
        sender: username,
        content: input,
        channel,
        type: "channel",
      };
    }

    try {
      await sendMessage(messageData);
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
    console.log("Message sent:", messageData);
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
    if (selectedChat.username) {
      return `${selectedChat.username}`;
    }
    return `#${selectedChat}`;
  };

  return (
    <div className="flex flex-col w-3/4 h-screen bg-gray-100 text-gray-900 p-4">
      {/* Chat Title */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-center">{getChatTitle()}</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-white p-4 rounded-lg shadow">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start justify-between mb-2 p-2 rounded ${
              msg.sender === username ? "bg-blue-100" : "bg-gray-200"
            }`}
          >
            <div className="flex items-start">
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  msg.sender === username ? "bg-blue-500" : "bg-red-500"
                }`}
              >
                <span className="text-white font-bold">
                  {msg.sender.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {msg.sender}{" "}
                  {msg.timestamp &&
                    new Date(msg.timestamp).toLocaleTimeString()}
                </p>
                <p className="text-gray-700">{msg.content}</p>
              </div>
            </div>
            {role === "admin" && (
              <button
                onClick={() => onDeleteMessage(msg._id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        ))}
        {typing && (
          <p className="text-sm italic text-gray-600">Someone is typing...</p>
        )}
      </div>

      {/* Summary Section */}
      <div className="mt-4">
        <button
          onClick={onSummarize}
          className="mb-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500"
        >
          Summarize
        </button>
        {summary && (
          <div className="mt-2 bg-white p-4 rounded shadow">
            <p className="text-gray-800">{summary}</p>
            <button
              onClick={() => setSummary("")}
              className="mt-2 px-3 py-1 border border-gray-300 rounded text-gray-800 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex mt-4">
        <input
          type="text"
          placeholder={`Message ${
            chatType === "privateChat" ? selectedChat : "#" + selectedChat
          }...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!selectedChat}
          className="flex-1 p-2 border border-gray-300 rounded bg-white text-gray-900 focus:outline-none"
        />
        <button
          onClick={onSendMessage}
          disabled={!input.trim() || !selectedChat}
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
