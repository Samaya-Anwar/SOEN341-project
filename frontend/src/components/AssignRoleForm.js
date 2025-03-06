// src/components/AssignRoleForm.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { TextField, Button, Typography } from "@mui/material";

const AssignRoleForm = () => {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("member");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch the list of users to assign roles
    axios.get("http://localhost:5001/api/users").then((response) => {
      setUsers(response.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put("http://localhost:5001/api/users/assign-role", {
        username,
        role,
      });
      alert(`Role for ${username} has been updated to ${role}`);
    } catch (error) {
      console.error("Error assigning role:", error);
    }
  };

  return (
    <div>
      <Typography variant="h6">Assign Role to User</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          required
        />
        <TextField
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
          select
          required
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </TextField>
        <Button type="submit" variant="contained" color="primary">
          Assign Role
        </Button>
      </form>
    </div>
  );
};

export default AssignRoleForm;
