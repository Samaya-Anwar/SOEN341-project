import React, { useState, useEffect, useMemo } from "react";
import { getMessages } from "../api/get/getMessages";
import { deleteMessage } from "../api/delete/deleteMessage";
import { io } from "socket.io-client";
import { sendMessage } from "../api/post/sendMessage";
import { getChatSummary } from "../api/get/getChatSummary";
import { useTheme } from "../context/ThemeContext";
import {
  EllipsisHorizontalIcon,
  ArrowDownCircleIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(API_URL);

const commonEmojis = ["😊", "👍", "❤️", "😂", "🎉", "🔥", "👋", "✨"];

const Chatbox = ({ selectedChat, chatType }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [summary, setSummary] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEmojiList, setShowEmojiList] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { isDarkMode } = useTheme();

  const username = localStorage.getItem("username") || "Anonymous";
  const role = localStorage.getItem("role");

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSummary("");
    setTyping(false);
    setShowEmojiList(false);
    setShowScrollButton(false);
    setIsAtBottom(true);
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
    if (
      !selectedChat ||
      (chatType === "channel" && selectedChat.username) ||
      (chatType === "privateChat" && !selectedChat?.username)
    )
      return "Select a chat";
    if (chatType === "privateChat" && selectedChat.username) {
      return `${selectedChat.username}`;
    } else if (chatType === "channel" && selectedChat) {
      return `#${selectedChat}`;
    }
    return "Select a chat";
  };

  const handleScroll = (e) => {
    const bottom =
      Math.abs(
        e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight
      ) < 1;
    setIsAtBottom(bottom);
    setShowScrollButton(!bottom);
  };

  const scrollToBottom = () => {
    const messageArea = document.getElementById("message-area");
    messageArea.scrollTop = messageArea.scrollHeight;
  };

  const addEmoji = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiList(false);
  };

  useEffect(() => {
    if (isAtBottom) {
      const chatContainer = document.getElementById("message-area");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [messages, isAtBottom]);

  return (
    <div
      className={`
      flex flex-col h-[calc(100vh-4rem)] md:h-screen w-full
      ${isDarkMode ? "bg-gray-900" : "bg-white"}
      transition-colors duration-200
    `}
    >
      <div
        className={`
        sticky top-0 z-20
        px-4 py-3 md:py-4
        border-b ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }
        flex items-center justify-between
        group
      `}
      >
        <div className="flex items-center space-x-3">
          <div
            className={`
            h-10 w-10 rounded-full flex items-center justify-center
            ${isDarkMode ? "bg-gray-700" : "bg-indigo-100"}
          `}
          >
            {chatType === "privateChat" ? (
              <span
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-indigo-600"
                }`}
              >
                {selectedChat?.username?.charAt(0).toUpperCase()}
              </span>
            ) : (
              <span
                className={`text-lg font-semibold ${
                  isDarkMode ? "text-white" : "text-indigo-600"
                }`}
              >
                #
              </span>
            )}
          </div>
          <div>
            <h2
              className={`text-lg font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              } truncate`}
            >
              {getChatTitle()}
            </h2>
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {typing ? "Typing..." : "Online"}
            </p>
          </div>
        </div>
        <button
          className={`p-2 rounded-full hover:${
            isDarkMode ? "bg-gray-700" : "bg-gray-100"
          } opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
        >
          <EllipsisHorizontalIcon
            className={`h-6 w-6 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          />
        </button>
      </div>

      {/* Messages Area */}
      <div
        id="message-area"
        className={`
          flex-1 overflow-y-auto
          px-3 py-4 md:px-6 md:py-6
          ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}
          space-y-3
        `}
        onScroll={handleScroll}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start space-x-2 sm:space-x-3 ${
              msg.sender === username ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender !== username && (
              <div
                className={`
                h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0
                ${
                  isDarkMode
                    ? "bg-gray-700 text-white"
                    : "bg-indigo-100 text-indigo-600"
                }
              `}
              >
                {msg.sender.charAt(0).toUpperCase()}
              </div>
            )}

            <div
              className={`
              group relative max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-2
              ${
                msg.sender === username
                  ? isDarkMode
                    ? "bg-indigo-600 text-white"
                    : "bg-indigo-600 text-white"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-100"
                  : "bg-white text-gray-800 border border-gray-200"
              }
              ${msg.sender === username ? "rounded-br-none" : "rounded-bl-none"}
              shadow-sm hover:shadow-md transition-shadow duration-200
            `}
            >
              <div className="flex justify-between items-start gap-2">
                <div
                  className={`
                  text-xs sm:text-sm mb-1 cursor-pointer
                  ${
                    msg.sender === username
                      ? "text-indigo-100"
                      : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }
                `}
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
              <div
                className={`
                h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0
                ${isDarkMode ? "bg-indigo-600" : "bg-indigo-600"} text-white
              `}
              >
                {msg.sender.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {typing && (
          <div
            className={`
            text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            } italic px-4
            flex items-center space-x-2
          `}
          >
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce delay-200" />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}

      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className={`
            absolute bottom-24 right-6 p-2 rounded-full shadow-lg
            ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-600"}
            hover:scale-110 transition-transform duration-200
          `}
        >
          <ArrowDownCircleIcon className="h-6 w-6" />
        </button>
      )}

      {/* Input Area */}
      <div
        className={`
        px-3 py-3 md:px-6 md:py-4
        border-t ${
          isDarkMode
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }
        sticky bottom-0 z-20
      `}
      >
        {showEmojiList && (
          <div
            className={`
            absolute bottom-full mb-2 p-2 rounded-lg shadow-lg
            ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }
            border flex gap-2 flex-wrap max-w-[200px]
          `}
          >
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                !selectedChat ||
                (chatType === "channel" && selectedChat.username) ||
                (chatType === "privateChat" && !selectedChat?.username)
                  ? ""
                  : `Message ${
                      chatType === "privateChat" && selectedChat?.username
                        ? selectedChat.username
                        : "#" + selectedChat
                    }...`
              }
              className={`
                w-full rounded-lg px-4 py-3 pr-12
                ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-indigo-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-indigo-500"
                }
                border focus:ring-2 focus:ring-indigo-500
                transition-all duration-200
                text-sm sm:text-base
              `}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!selectedChat}
            />
            <div className="absolute right-2 bottom-2 flex space-x-2">
              <button
                onClick={() => setShowEmojiList(!showEmojiList)}
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-600"
                    : "text-gray-500"
                }`}
              >
                <FaceSmileIcon className="h-5 w-5" />
              </button>
              <button
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-600"
                    : "text-gray-500"
                }`}
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              <button
                className={`p-1 rounded-full hover:bg-gray-100 ${
                  isDarkMode
                    ? "text-gray-400 hover:bg-gray-600"
                    : "text-gray-500"
                }`}
              >
                <DocumentIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            onClick={onSendMessage}
            disabled={!input.trim() || !selectedChat}
            className={`
              p-3 rounded-full
              ${
                isDarkMode
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
              hover:scale-105
              flex-shrink-0
            `}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        {chatType !== "privateChat" && (
          <div className="px-4 pt-3">
            <button
              onClick={onSummarize}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg w-full sm:w-auto
                ${
                  isDarkMode
                    ? "bg-indigo-500 text-white hover:bg-indigo-400"
                    : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                }
                transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              disabled={!selectedChat}
            >
              Summarize Conversation
            </button>
          </div>
        )}

        {summary && (
          <div
            className={`px-4 py-3 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}
          >
            <div
              className={`
              rounded-lg p-4
              ${isDarkMode ? "bg-gray-700" : "bg-white"}
              shadow-sm
            `}
            >
              <h3
                className={`font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                } mb-2`}
              >
                Conversation Summary
              </h3>
              <p
                className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              >
                {summary}
              </p>
              <button
                onClick={() => setSummary("")}
                className={`
                  mt-3 text-sm
                  ${
                    isDarkMode
                      ? "text-indigo-400 hover:text-indigo-300"
                      : "text-indigo-600 hover:text-indigo-500"
                  }
                  transition-colors
                `}
              >
                Close Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

  );
};

export default Chatbox;
