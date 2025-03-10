/*import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginSignup from "./components/LoginSignup";
import Sidebar from "./components/Sidebar";
import Chatbox from "./components/Chatbox";
import AdminDashboard from "./components/AdminDashboard";

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
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard /> {/* Admin Dashboard *//*}
            </ProtectedAdminRoute>
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

// **Protected Route for Admin Dashboard**
const ProtectedAdminRoute = ({ children }) => {
  const role = localStorage.getItem("role");
  // Check if the user has an admin role
  return role === "admin" ? children : <Navigate to="/" />;
};

export default App;
*/

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminDashboard from "./components/AdminDashboard"; // **Import AdminDashboard**
import Chat from "./components/Chat";
import LoginSignup from "./components/LoginSignup";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginSignup />} />

        {/* Protected Routes */}
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} /> {/* **Admin Dashboard Route** */}

        {/* Fallback for non-matching routes */}
        <Route path="*" element={<LoginSignup />} />
      </Routes>
    </Router>
  );
};

export default App;
