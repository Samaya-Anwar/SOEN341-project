import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Chatbox from "../components/Chatbox";
import LoginSignup from "../components/LoginSignup";
import Sidebar from "../components/Sidebar";

function App() {
  const [selectedChat, setSelectedChat] = useState(null);
  const username = localStorage.getItem("username");

  return (
    <Routes>
      <Route path="/" element={<LoginSignup />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <div style={{ display: "flex" }}>
              <Sidebar onSelectChat={setSelectedChat} />
              <Chatbox selectedChat={selectedChat} username={username} />
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

export default App;
