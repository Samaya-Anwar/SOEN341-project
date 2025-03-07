import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, FormControlLabel, Checkbox, Box } from '@mui/material';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);

  useEffect(() => {
    // Fetch all users from the backend
    axios.get("http://localhost:5001/api/users")
      .then((response) => {
        setUsers(response.data);
        setEditedUsers(response.data); // Initialize with the current users' data
      })
      .catch((error) => console.error('Error fetching users:', error));
  }, []);

  const handleRoleChange = (username, checked) => {
    // Update the user's role based on the checkbox state (checked or not)
    setEditedUsers(editedUsers.map(user =>
      user.username === username ? { ...user, role: checked ? 'admin' : 'member' } : user
    ));
  };

  const handleSaveChanges = () => {
    // Save the role changes for all users
    editedUsers.forEach((user) => {
      if (user.role !== users.find(u => u.username === user.username)?.role) {
        axios.put("http://localhost:5001/api/users/assign-role", {
          username: user.username,
          role: user.role,
        })
        .then(() => console.log(`Updated role for ${user.username}`))
        .catch((error) => console.error(`Error updating role for ${user.username}:`, error));
      }
    });
  };

  const handleCancelChanges = () => {
    // Reset the edited users to the original list of users
    setEditedUsers(users);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',  // Make sure it takes up full viewport height
      padding: '20px',
      backgroundColor: '#f4f4f4',  // Optional background color
    }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="h6" gutterBottom>Manage User Roles</Typography>

      {/* List of users with checkboxes to change roles */}
      <Box sx={{ width: '100%', maxWidth: 600 }}>
        {editedUsers.map((user) => (
          <Box key={user.username} sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <Typography sx={{ flexGrow: 1 }}>
              {user.username} - {user.role}
            </Typography>
            {/* Checkbox to change role */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={user.role === 'admin'}
                  onChange={(e) => handleRoleChange(user.username, e.target.checked)}
                  color="primary"
                />
              }
              label="Admin"
            />
          </Box>
        ))}
      </Box>

      {/* Save and Cancel buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, width: '100%', maxWidth: 600 }}>
        <Button variant="outlined" color="secondary" onClick={handleCancelChanges}>
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
