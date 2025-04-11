import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { createPrivateChat } from "../api/post/createPrivateChat";
import { getPrivateChat } from "../api/get/getPrivateChats";
import { deletePrivateChat } from "../api/delete/deletePrivateChat";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({
  onSelectChat,
  onSelectChatType,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [searchQuery, setSearchQuery] = useState("");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [alert, setAlert] = useState({ message: "", type: "", show: false });
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [promptData, setPromptData] = useState({
    show: false,
    type: "",
    message: "",
    action: null,
  });
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await getChannels();
        console.log("Fetched channels:", response);
        setChannels(response);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };
    fetchChannels();
    socket.on("channelUpdated", fetchChannels);

    return () => socket.off("channelUpdated", fetchChannels);
  }, []);

  useEffect(() => {
    const fetchPrivateChats = async () => {
      try {
        const response = await getPrivateChat();
        console.log("Fetched private chats:", response);
        setPrivateChats(response);
      } catch (error) {
        console.error("Error fetching private chats:", error);
        setPrivateChats([]);
      }
    };

    if (username) {
      fetchPrivateChats();
    }
    socket.on("privateChatUpdated", fetchPrivateChats);
    return () => socket.off("privateChatUpdated", fetchPrivateChats);
  }, [username]);

  useEffect(() => {
    const handleNewPrivateMessage = (message) => {
      setPrivateChats((prevChats) => {
        const updatedChats = [...prevChats];
        const partnerId =
          message.senderId === username ? message.receiverId : message.senderId;
        const existingChatIndex = updatedChats.findIndex(
          (chat) => chat.partnerId === partnerId
        );
        if (existingChatIndex !== -1) {
          updatedChats[existingChatIndex].messages.push(message);
        } else {
          updatedChats.push({ partnerId, messages: [message] });
        }
        return updatedChats;
      });
    };

    socket.on("newPrivateMessage", handleNewPrivateMessage);
    return () => socket.off("newPrivateMessage", handleNewPrivateMessage);
  }, [username]);

  const combinedChats = useMemo(() => {
    if (!Array.isArray(privateChats)) return [];
    return privateChats.map((chat) => {
      const partnerUsername = chat.participants.find((p) => p !== username);
      return {
        chatId: chat._id,
        partnerId: partnerUsername,
        username: partnerUsername || "Unknown",
        messages: chat.messages || [],
      };
    });
  }, [privateChats, username]);
  const filteredChannels = channels.filter((channel) =>
    (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPrivateChats = useMemo(() => {
    return combinedChats.filter((chat) =>
      chat.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedChats, searchQuery]);

  const onCreateChannel = () => {
    showPrompt("input", "Enter new channel name:", (channelName) => {
      if (channelName) {
        handleCreateChannel(channelName);
      }
    });
  };
  const onCreatePrivateChat = async () => {
    showPrompt(
      "input",
      "Enter username to start chat with:",
      (partnerUsername) => {
        if (partnerUsername !== null && partnerUsername.trim() !== "") {
          handleCreatePrivateChat(partnerUsername.trim());
        }
      }
    );
  };

  const handleCreatePrivateChat = async (partnerUsername) => {
    const exists = combinedChats.find(
      (chat) => chat.username.toLowerCase() === partnerUsername.toLowerCase()
    );
    if (exists) {
      onSelectChat({ username: partnerUsername, chatId: exists.chatId });
      onSelectChatType("privateChat");
      return;
    }
    try {
      const response = await createPrivateChat({
        participants: [username, partnerUsername],
      });
      console.log("New private chat created:", response.data);
      socket.emit("privateChatUpdated");
      if (response?.data?._id) {
        onSelectChat({ username: partnerUsername, chatId: response.data._id });
        onSelectChatType("privateChat");
      } else {
        console.error("No chat ID returned in response:", response);
      }
    } catch (error) {
      console.error("Error starting new private chat:", error);
    }
  };
  const handleCreateChannel = async (channelName) => {
    try {
      await createChannel(channelName);
      socket.emit("channelUpdated");
      setAlert({
        message: "Channel created successfully",
        type: "success",
        show: true,
      });
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    } catch (error) {
      setAlert({
        message: error.response?.data?.message || "Error creating channel",
        type: "error",
        show: true,
      });
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    }
  };
  const onDeletePrivateChat = async (chatId) => {
    try {
      await deletePrivateChat(chatId);
      socket.emit("privateChatUpdated");
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    } catch (error) {
      setAlert({
        message: error.response?.data?.message || "Error deleting channel",
        type: "error",
        show: true,
      });
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    }
  };
  const onDeleteChannel = async (channel) => {
    try {
      console.log("Deleting channel:", channel);
      await deleteChannel(channel);
      socket.emit("channelUpdated");
      setAlert({
        message: "Channel deleted successfully",
        type: "success",
        show: true,
      });
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    } catch (error) {
      setAlert({
        message: error.response?.data?.message || "Error deleting channel",
        type: "error",
        show: true,
      });
      setIsAlertVisible(true);
      setTimeout(() => {
        setIsAlertVisible(false);
        setAlert({ message: "", type: "", show: false });
      }, 5000);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    navigate("/login");
  };
  const showPrompt = (type, message, action) => {
    setPromptData({ show: true, type, message, action });
    setIsPromptVisible(true);
  };

  const handlePromptAction = (value) => {
    if (promptData.action && value) {
      promptData.action(value);
    }
    setIsPromptVisible(false);
    setPromptData({ show: false, type: "", message: "", action: null });
  };

  const handlePromptClose = () => {
    setIsPromptVisible(false);
    setPromptData({ show: false, type: "", message: "", action: null });
  };

  const handleSelectChannel = (channelName) => {
    onSelectChat(channelName);
    onSelectChatType("channel");
    setIsMobileMenuOpen(false);
  };
  const handleSelectPrivateChat = (chat) => {
    onSelectChat(chat);
    onSelectChatType("privateChat");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-gray-600/75 dark:bg-gray-900/75 backdrop-blur-sm z-20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:static inset-y-0 left-0
          w-[280px] md:w-[320px]
          ${isDarkMode ? "bg-gray-800" : "bg-white"}
          ${isDarkMode ? "border-gray-700" : "border-gray-200"}
          border-r
          transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          transition-all duration-300 ease-in-out
          flex flex-col
          z-30
        `}
      >
        <div
          className={`
          px-6 py-4 border-b
          ${isDarkMode ? "border-gray-700" : "border-gray-200"}
        `}
        >
          <a href="/">
            <img alt="ChatApp" src="./logo.png" className="h-12 w-auto" />
          </a>
          <h2
            className={`
            mt-4 text-xl font-bold
            ${isDarkMode ? "text-gray-100" : "text-gray-900"}
          `}
          >
            Welcome, {username || "Anonymous"}
          </h2>
        </div>

        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Search channels and chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`
              w-full px-3 py-2 rounded-lg border
              ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder:text-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
              }
              focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-colors
            `}
          />
        </div>

        <div
          className={`
          flex border-b
          ${isDarkMode ? "border-gray-700" : "border-gray-200"}
        `}
        >
          <button
            onClick={() => {
              setActiveTab("channels");
              onSelectChatType("channel");
            }}
            className={`
              flex-1 py-2 px-4 text-sm font-medium
              ${
                activeTab === "channels"
                  ? isDarkMode
                    ? "text-white border-b-2 border-indigo-400 bg-gray-700"
                    : "text-indigo-600 border-b-2 border-indigo-600 bg-gray-50"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }
              transition-colors
            `}
          >
            Channels
          </button>
          <button
            onClick={() => {
              setActiveTab("privateChats");
              onSelectChatType("privateChat");
            }}
            className={`
              flex-1 py-2 px-4 text-sm font-medium
              ${
                activeTab === "privateChats"
                  ? isDarkMode
                    ? "text-white border-b-2 border-indigo-400 bg-gray-700"
                    : "text-indigo-600 border-b-2 border-indigo-600 bg-gray-50"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
              }
              transition-colors
            `}
          >
            Private Chats
          </button>
        </div>

        <div
          className={`
          flex-1 overflow-y-auto px-4 py-4
          ${isDarkMode ? "bg-gray-800" : "bg-white"}
        `}
        >
          {activeTab === "channels" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3
                  className={`
                  text-lg font-medium
                  ${isDarkMode ? "text-gray-100" : "text-gray-900"}
                `}
                >
                  Channels
                </h3>
                {role === "admin" && (
                  <button
                    onClick={onCreateChannel}
                    className={`
                      text-sm font-medium
                      ${
                        isDarkMode
                          ? "text-indigo-400 hover:text-indigo-300"
                          : "text-indigo-600 hover:text-indigo-500"
                      }
                      transition-colors
                    `}
                  >
                    + Add Channel
                  </button>
                )}
              </div>

              {filteredChannels.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  No channels available
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredChannels.map((channel) => (
                    <div
                      key={channel.name}
                      onClick={() => handleSelectChannel(channel.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg
                        cursor-pointer
                        ${
                          isDarkMode
                            ? "hover:bg-gray-700 text-gray-100"
                            : "hover:bg-gray-50 text-gray-900"
                        }
                        transition-colors
                      `}
                    >
                      <span>{channel.name}</span>
                      {role === "admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChannel(channel.name);
                          }}
                          className="ml-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "privateChats" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3
                  className={`
                  text-lg font-medium
                  ${isDarkMode ? "text-gray-100" : "text-gray-900"}
                `}
                >
                  Private Chats
                </h3>
                <button
                  onClick={onCreatePrivateChat}
                  className={`
                    text-sm font-medium
                    ${
                      isDarkMode
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }
                    transition-colors
                  `}
                >
                  + New Chat
                </button>
              </div>

              {filteredPrivateChats.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  No private chats found
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredPrivateChats.map((chat) => (
                    <div
                      key={chat.partnerId}
                      onClick={() => handleSelectPrivateChat(chat)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg
                        cursor-pointer
                        ${
                          isDarkMode
                            ? "hover:bg-gray-700 text-gray-100"
                            : "hover:bg-gray-50 text-gray-900"
                        }
                        transition-colors
                      `}
                    >
                      <div>
                        <div
                          className={`font-medium ${
                            isDarkMode ? "text-gray-100" : "text-gray-900"
                          }`}
                        >
                          {chat.username}
                        </div>
                        {chat.messages && chat.messages.length > 0 && (
                          <div
                            className={`text-sm ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            } truncate`}
                          >
                            {chat.messages[chat.messages.length - 1].content}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePrivateChat(chat.chatId);
                        }}
                        className={`
                          text-sm text-red-600 hover:text-red-500
                          ${
                            isDarkMode
                              ? "text-gray-400 hover:text-gray-300"
                              : "text-gray-500 hover:text-gray-700"
                          }
                        `}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`
          mt-auto border-t p-4
          ${
            isDarkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }
        `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                {username ? username.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <div
                  className={`font-medium ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {username || "Anonymous"}
                </div>
                {role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {role || "Member"}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`
                p-2 rounded-lg
                ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-600"
                }
                transition-colors
              `}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className={`
              mt-4 w-full rounded-lg px-3 py-2 text-sm font-semibold text-white
              ${
                isDarkMode
                  ? "bg-indigo-500 hover:bg-indigo-400"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }
              transition-colors
            `}
          >
            Logout
          </button>
        </div>
      </div>

      {alert.show && isAlertVisible && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] max-w-md ${
            alert.type === "success"
              ? isDarkMode
                ? "bg-green-900 text-green-200"
                : "bg-green-100 text-green-800"
              : isDarkMode
              ? "bg-red-900 text-red-200"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div className="flex items-center">
            {alert.type === "success" ? (
              <CheckIcon className="h-5 w-5 mr-2" />
            ) : (
              <XMarkIcon className="h-5 w-5 mr-2" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => {
              setIsAlertVisible(false);
              setAlert({ message: "", type: "", show: false });
            }}
            className={`ml-4 p-1 rounded-full hover:bg-opacity-20 hover:bg-black ${
              isDarkMode ? "text-green-200" : "text-green-800"
            }`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {promptData.show && isPromptVisible && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex flex-col min-w-[300px] max-w-md ${
            isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">{promptData.message}</span>
            <button
              onClick={handlePromptClose}
              className={`p-1 rounded-full hover:bg-opacity-20 hover:bg-black ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          {promptData.type === "input" && (
            <div className="flex gap-2">
              <input
                type="text"
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePromptAction(e.target.value);
                  }
                }}
                autoFocus
              />
              <button
                onClick={() =>
                  handlePromptAction(document.querySelector("input").value)
                }
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDarkMode
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                Confirm
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Sidebar;
