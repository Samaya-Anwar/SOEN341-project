import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { createPrivateChat } from "../api/post/createPrivateChat";
import { getPrivateChat } from "../api/get/getPrivateChats";
import { deletePrivateChat } from "../api/delete/deletePrivateChat";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType = () => {} }) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [searchQuery, setSearchQuery] = useState("");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await getChannels();
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

  const onCreatePrivateChat = async (partnerUsername) => {
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
  const onDeletePrivateChat = async (chatId) => {
    try {
      await deletePrivateChat(chatId);
      socket.emit("privateChatUpdated");
    } catch (error) {
      console.error("Error deleting private chat:", error);
    }
  };

  const onCreateChannel = async () => {
    const channelName = prompt("Enter new channel name:");
    if (!channelName) return;

    try {
      await createChannel(channelName);
      socket.emit("channelUpdated");
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const onDeleteChannel = async (channel) => {
    try {
      await deleteChannel(channel);
      socket.emit("channelUpdated");
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    navigate("/login");
  };
  const handleSelectChannel = (channelName) => {
    onSelectChat(channelName);
    onSelectChatType("channel");
  };
  const handleSelectPrivateChat = (chat) => {
    onSelectChat(chat);
    onSelectChatType("privateChat");
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="px-6 py-4">
        <a href="/">
          <img alt="ChatApp" src="./logo.png" className="h-12 w-auto" />
        </a>
        <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-900">
          Welcome, {username || "Anonymous"}
        </h2>
      </div>

      <div className="px-6 mt-2 mb-4">
        <input
          type="text"
          placeholder="Search channels and chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-md border-gray-300 border px-3 py-1.5 text-gray-900"
        />
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("channels");
            onSelectChatType("channel");
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "channels"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Channels
        </button>
        <button
          onClick={() => {
            setActiveTab("privateChats");
            onSelectChatType("privateChat");
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === "privateChats"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Private Chats
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {activeTab === "channels" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Channels</h3>
              {role === "admin" && (
                <button
                  onClick={onCreateChannel}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
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
              <ul className="space-y-2">
                {filteredChannels.map((channel) => (
                  <li
                    key={channel.name}
                    className="flex justify-between items-center rounded-md hover:bg-gray-50 px-3 py-2 cursor-pointer"
                    onClick={() => handleSelectChannel(channel.name)}
                  >
                    <span className="text-gray-900">{channel.name}</span>
                    {role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChannel(channel.name);
                        }}
                        className="text-sm text-red-600 hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "privateChats" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Private Chats
              </h3>
              <button
                onClick={() => {
                  const usernameToChat = prompt(
                    "Enter username to start chat with:"
                  );
                  if (usernameToChat !== null && usernameToChat.trim() !== "") {
                    onCreatePrivateChat(usernameToChat.trim());
                  } else {
                    alert("No username entered.");
                  }
                }}
                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                + New Chat
              </button>
            </div>

            {filteredPrivateChats.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-4">
                No private chats found
              </p>
            ) : (
              <ul className="space-y-2">
                {filteredPrivateChats.map((chat) => (
                  <li
                    key={chat.partnerId}
                    className="flex justify-between items-center rounded-md hover:bg-gray-50 px-3 py-2 cursor-pointer"
                    onClick={() => handleSelectPrivateChat(chat)}
                  >
                    <div>
                      <div className="text-gray-900">{chat.username}</div>
                      {chat.messages && chat.messages.length > 0 && (
                        <div className="text-sm text-gray-500 truncate">
                          {chat.messages[chat.messages.length - 1].content}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrivateChat(chat.chatId);
                      }}
                      className="text-sm text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto border-t border-gray-200 px-6 py-4">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white mr-2">
            {username ? username.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="text-gray-900">{username || "Anonymous"}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
