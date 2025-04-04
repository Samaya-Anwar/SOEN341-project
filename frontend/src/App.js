import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Hero from "./components/Hero";
import LoginSignup from "./components/LoginSignup";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatType, setChatType] = useState(null);

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
            <div style={{ display: "flex" }}>
              <Sidebar
                onSelectChat={setSelectedChat}
                onSelectChatType={setChatType}
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
