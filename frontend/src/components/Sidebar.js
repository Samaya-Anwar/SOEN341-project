import React, { useState, useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { createChannel } from "../api/post/createChannel";
import { getChannels } from "../api/get/getChannels";
import { deleteChannel } from "../api/delete/deleteChannel";
import { createPrivateChat } from "../api/post/createPrivateChat";
import { getPrivateChat } from "../api/get/getPrivateChats";
import { deletePrivateChat } from "../api/delete/deletePrivateChat";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../api/get/getUsers";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;
const socket = io(`${API_URL}`);

const Sidebar = ({ onSelectChat, onSelectChatType = () => {} }) => {
  const [channels, setChannels] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [activeTab, setActiveTab] = useState("channels");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        setUsers(response);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch channels
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

  // Fetch private chats
  useEffect(() => {
    const fetchPrivateChats = async () => {
      try {
        const response = await getPrivateChat();
        setPrivateChats(response);
      } catch (error) {
        console.error("Error fetching private chats:", error);
      }
    };

    if (userId) {
      fetchPrivateChats();
    }
    socket.on("privateChatUpdated", fetchPrivateChats);
    return () => socket.off("privateChatUpdated", fetchPrivateChats);
  }, [userId]);

  // Handle incoming private messages
  useEffect(() => {
    const handleNewPrivateMessage = (message) => {
      setPrivateChats((prevChats) => {
        const updatedChats = [...prevChats];
        const partnerId =
          message.senderId === userId ? message.receiverId : message.senderId;
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
  }, [userId]);

  // Combine private chats with user data
  const combinedChats = useMemo(() => {
    return privateChats.map((chat) => {
      const partnerId = chat.participants.find((p) => p.toString() !== userId);
      const partner = users.find((u) => u._id === partnerId);
      return {
        chatId: chat._id,
        partnerId,
        username: partner ? partner.username : "Unknown",
        messages: chat.messages || [],
      };
    });
  }, [privateChats, users, userId]);

  const filteredChannels = channels.filter((channel) =>
    (channel.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivateChats = useMemo(() => {
    return combinedChats.filter((chat) =>
      chat.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedChats, searchQuery]);

  const onCreatePrivateChat = async (partner) => {
    const exists = combinedChats.find((chat) => chat.partnerId === partner._id);
    if (exists) {
      onSelectChat({ ...partner, chatId: exists.chatId });
      onSelectChatType("privateChat");
      return;
    }
    try {
      const response = await createPrivateChat({
        participants: [userId, partner._id],
      });
      socket.emit("privateChatUpdated");
      onSelectChat({ ...partner, chatId: response.data._id });
      onSelectChatType("privateChat");
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

  const onDeleteChannel = async (channelName) => {
    try {
      await deleteChannel(channelName);
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
    <div className="w-1/4 h-screen bg-gray-100 text-gray-900 p-4 flex flex-col justify-between">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search channels and private chats..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 mb-4 border rounded bg-white"
      />

      <div>
        {/* Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => {
              setActiveTab("channels");
              onSelectChatType("channel");
            }}
            className={`flex-1 py-2 ${
              activeTab === "channels"
                ? "text-gray-900 font-bold border-b-2 border-gray-900"
                : "text-gray-500"
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => {
              setActiveTab("privateChats");
              onSelectChatType("privateChat");
            }}
            className={`flex-1 py-2 ${
              activeTab === "privateChats"
                ? "text-gray-900 font-bold border-b-2 border-gray-900"
                : "text-gray-500"
            }`}
          >
            Private Chats
          </button>
        </div>

        {activeTab === "channels" && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Channels</h3>
              {role === "admin" && (
                <button onClick={onCreateChannel} className="text-blue-500">
                  + Add Channel
                </button>
              )}
            </div>
            <ul>
              {filteredChannels.length > 0 ? (
                filteredChannels.map((channel) => (
                  <li
                    key={channel.name}
                    onClick={() => handleSelectChannel(channel.name)}
                    className="p-2 rounded hover:bg-gray-200 cursor-pointer flex justify-between items-center mb-1"
                  >
                    <span>{channel.name}</span>
                    {role === "admin" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChannel(channel.name);
                        }}
                        className="text-red-500 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 my-2">
                  No channels available
                </p>
              )}
            </ul>
          </div>
        )}

        {activeTab === "privateChats" && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Private Chats</h3>
              <button
                onClick={() => {
                  const usernameToChat = prompt(
                    "Enter username to start chat with:"
                  );
                  if (!usernameToChat) return;
                  const partner = users.find(
                    (u) =>
                      u.username.toLowerCase() === usernameToChat.toLowerCase()
                  );
                  if (partner) {
                    onCreatePrivateChat(partner);
                  } else {
                    alert("User not found.");
                  }
                }}
                className="text-blue-500"
              >
                + New Chat
              </button>
            </div>
            <ul>
              {filteredPrivateChats.length > 0 ? (
                filteredPrivateChats.map((chat) => (
                  <li
                    key={chat.partnerId}
                    onClick={() => handleSelectPrivateChat(chat)}
                    className="p-2 rounded hover:bg-gray-200 cursor-pointer flex justify-between items-center mb-1"
                  >
                    <div>
                      <p className="font-semibold">{chat.username}</p>
                      <p className="text-sm text-gray-600">
                        {chat.messages && chat.messages.length > 0
                          ? chat.messages[chat.messages.length - 1].content
                          : "New Conversation"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrivateChat(chat.chatId);
                      }}
                      className="text-red-500 text-sm"
                    >
                      Delete
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 my-2">
                  No private chats found
                </p>
              )}
            </ul>
          </div>
        )}
      </div>

      <hr className="my-4 border-gray-300" />

      {/* User Info and Logout */}
      <div>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center mr-2">
            <span className="text-white">
              {userId ? userId.charAt(0).toUpperCase() : "A"}
            </span>
          </div>
          <span>{userId || "Anonymous"}</span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
