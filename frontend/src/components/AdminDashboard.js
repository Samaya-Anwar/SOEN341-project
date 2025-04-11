import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import {
  MagnifyingGlassIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const token = localStorage.getItem("token");
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Fetch all users on mount
  useEffect(() => {
    axios
      .get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsers(res.data);
        setEditedUsers(res.data);
      })
      .catch((err) => console.error("Error fetching users:", err));
  }, [token]);

  const handleRoleChange = (username, checked) => {
    const updated = editedUsers.map((user) =>
      user.username === username
        ? { ...user, role: checked ? "admin" : "member" }
        : user
    );
    setEditedUsers(updated);
  };

  const handleSaveChanges = async () => {
    try {
      const updatePromises = editedUsers.map((user) => {
        const original = users.find((u) => u.username === user.username);
        if (original && original.role !== user.role) {
          // Only send update if role has changed
          return axios.put(
            `${API_URL}/api/users/assign-role`,
            { username: user.username, role: user.role },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      setSaveMessage("Changes saved successfully.");
      // Optionally, refresh user list from backend
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setEditedUsers(res.data);
    } catch (err) {
      console.error("Error saving changes:", err);
      setSaveMessage("Error saving changes.");
    }
  };

  const navigateToChat = () => {
    navigate("/chat");
  };

  // Filter out any user objects missing a username
  const filteredUsers = editedUsers.filter(
    (user) =>
      user.username &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simple sort: letters first, then numbers
  const sortedUsers = filteredUsers.sort((a, b) => {
    const aName = a.username.toLowerCase();
    const bName = b.username.toLowerCase();
    const isNumA = /^\d/.test(aName);
    const isNumB = /^\d/.test(bName);

    if (isNumA && !isNumB) return 1;
    if (!isNumA && isNumB) return -1;
    return aName.localeCompare(bName);
  });

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className={`text-3xl font-bold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Admin Dashboard
            </h1>
            <h2
              className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Manage User Roles
            </h2>
          </div>
          <button
            onClick={navigateToChat}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
            Go to Chat
          </button>
        </div>

        <div
          className={`relative mb-6 ${
            isDarkMode ? "bg-gray-800" : "bg-gray-100"
          } rounded-lg overflow-hidden`}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon
              className={`h-5 w-5 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            />
          </div>
          <input
            type="text"
            placeholder="Search by Username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 ${
              isDarkMode
                ? "bg-gray-800 text-white placeholder-gray-400"
                : "bg-gray-100 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
        </div>

        <div
          className={`mb-6 rounded-lg overflow-hidden ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } shadow-sm`}
        >
          {sortedUsers.map((user) => (
            <div
              key={user.username}
              className={`flex items-center justify-between p-4 border-b ${
                isDarkMode ? "border-gray-700" : "border-gray-200"
              } last:border-b-0`}
            >
              <div className="flex items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isDarkMode ? "bg-gray-700" : "bg-indigo-100"
                  }`}
                >
                  <span
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-indigo-600"
                    }`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <div
                    className={`font-medium ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user.username}
                  </div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {user.role}
                  </div>
                </div>
              </div>

              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={user.role === "admin"}
                    onChange={(e) =>
                      handleRoleChange(user.username, e.target.checked)
                    }
                  />
                  <div
                    className={`block w-14 h-8 rounded-full ${
                      user.role === "admin"
                        ? isDarkMode
                          ? "bg-indigo-600"
                          : "bg-indigo-600"
                        : isDarkMode
                        ? "bg-gray-700"
                        : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${
                      user.role === "admin" ? "transform translate-x-6" : ""
                    }`}
                  ></div>
                </div>
                <div
                  className={`ml-3 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Admin
                </div>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveChanges}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            isDarkMode
              ? "bg-indigo-600 text-white hover:bg-indigo-500"
              : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          Save Changes
        </button>

        {saveMessage && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center ${
              saveMessage.includes("Error")
                ? isDarkMode
                  ? "bg-red-900 text-red-200"
                  : "bg-red-100 text-red-800"
                : isDarkMode
                ? "bg-green-900 text-green-200"
                : "bg-green-100 text-green-800"
            }`}
          >
            <CheckIcon className="h-5 w-5 mr-2" />
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
