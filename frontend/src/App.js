import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import Hero from "./components/Hero";
import LoginSignup from "./components/LoginSignup";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import AdminDashboard from "./components/AdminDashboard";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

function AppContent() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode } = useTheme();

  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/login" element={<LoginSignup />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <div
              className={`flex flex-col md:flex-row h-screen overflow-hidden ${
                isDarkMode ? "bg-gray-900" : "bg-white"
              }`}
            >
              <div
                className={`md:hidden flex items-center px-4 py-2 border-b ${
                  isDarkMode
                    ? "border-gray-700 bg-gray-800"
                    : "border-gray-200 bg-white"
                }`}
              >
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? "text-white hover:bg-gray-700"
                      : "text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                  ) : (
                    <Bars3Icon className="h-6 w-6" />
                  )}
                </button>
              </div>

              <Sidebar
                onSelectChat={setSelectedChat}
                onSelectChatType={setChatType}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
              <Chatbox selectedChat={selectedChat} chatType={chatType} />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

// Main App component that provides the theme context
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

// **Protected Route**
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  return token && role === "admin" ? children : <Navigate to="/" />;
};

export default App;
