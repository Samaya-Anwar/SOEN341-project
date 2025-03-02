import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginSignup from "./components/LoginSignup";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";

function App() {
  const [selectedChat, setSelectedChat] = useState(null);
  const username = localStorage.getItem("username");

  return (
    <Router>
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
    </Router>
  );
}

// **Protected Route**
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

export default App;
