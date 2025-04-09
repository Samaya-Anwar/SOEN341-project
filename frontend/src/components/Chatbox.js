import React, { useState, useEffect, useMemo } from "react";
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
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] md:h-screen bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 px-4 sm:px-6 py-4 bg-white shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
          {getChatTitle()}
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 sm:space-x-3 ${
              msg.sender === username ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender !== username && (
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                {msg.sender.charAt(0).toUpperCase()}
              </div>
            )}

            <div
              className={`max-w-[75%] sm:max-w-[70%] rounded-lg px-4 py-2 relative group ${
                msg.sender === username
                  ? "bg-indigo-600 text-white ml-auto"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div
                  className={`text-xs sm:text-sm mb-1 ${
                    msg.sender === username
                      ? "text-indigo-100"
                      : "text-gray-500"
                  }`}
                >
                  {msg.sender}{" "}
                  <span className="text-xs opacity-75">
                    {msg.timestamp &&
                      new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {role === "admin" && (
                  <button
                    onClick={() => onDeleteMessage(msg._id)}
                    className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="text-sm sm:text-base break-words">
                {msg.content}
              </div>
            </div>

            {msg.sender === username && (
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                {msg.sender.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div className="text-sm text-gray-500 italic px-4">
            Someone is typing...
          </div>
        )}
      </div>

      {/* Summary Section */}
      {summary && (
        <div className="px-4 sm:px-6 py-4 bg-gray-100 border-t border-gray-200">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-2">
              Conversation Summary
            </h3>
            <p className="text-sm sm:text-base text-gray-700">{summary}</p>
            <button
              onClick={() => setSummary("")}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white">
        {!summary && (
          <button
            onClick={onSummarize}
            className="mb-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedChat}
          >
            Summarize Conversation
          </button>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Message ${
              chatType === "privateChat" && selectedChat?.username
                ? selectedChat.username
                : "#" + selectedChat
            }...`}
            className="flex-1 rounded-lg border-gray-300 border px-3 py-2 text-sm sm:text-base text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={!selectedChat}
          />
          <button
            onClick={onSendMessage}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
            disabled={!input.trim() || !selectedChat}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
