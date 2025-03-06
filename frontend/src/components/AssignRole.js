import React, { useState } from "react";
import axios from "axios";

const AssignRoleForm = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("member");
  const [message, setMessage] = useState("");

  const handleRoleChange = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token"); // Get JWT token
      const response = await axios.post(
        "http://localhost:5001/api/assign-role", // Make API call to assign the role
        { username, newRole: role },
        {
          headers: { Authorization: `Bearer ${token}` } // Send JWT token for authentication
        }
      );
      setMessage(response.data.message); // Display success message
    } catch (error) {
      setMessage(error.response.data.error || "Error assigning role"); // Display error message
    }
  };

  return (
    <form onSubmit={handleRoleChange}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Assign Role</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default AssignRoleForm;
