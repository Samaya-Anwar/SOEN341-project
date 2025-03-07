import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, FormControlLabel, Checkbox, Box, TextField } from '@mui/material';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // New state for search input

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
    setEditedUsers(editedUsers.map(user =>
      user.username === username ? { ...user, role: checked ? 'admin' : 'member' } : user
    ));
  };

  const handleSaveChanges = () => {
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
    setEditedUsers(users);
  };

  // Filter users based on the search term
  const filteredUsers = editedUsers.filter(user =>
    user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#333',
      color: 'white',
      overflowY: 'auto',
    }}>
      <Typography variant="h4" gutterBottom color="inherit">Admin Dashboard</Typography>
      <Typography variant="h6" gutterBottom color="inherit">Manage User Roles</Typography>

      {/* Box to contain search bar and users list with a darker background */}
      <Box sx={{
        width: '100%',
        maxWidth: 600,
        backgroundColor: '#2c2c2c',
        padding: 2,
        borderRadius: 2,
        boxShadow: 2,
      }}>
        {/* Search bar to filter users */}
        <TextField
          label="Search by Member Name"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '100%', marginBottom: 2 }}
          InputProps={{
            style: {
              color: 'white',
              borderColor: 'white',
            }
          }}
          InputLabelProps={{
            style: {
              color: 'white',
            }
          }}
        />

        {/* List of users with checkboxes to change roles */}
        <Box sx={{ width: '100%' }}>
          {filteredUsers.map((user) => (
            <Box key={user.username} sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <Typography sx={{ flexGrow: 1 }} color="inherit">
                {user.username} - {user.role}
              </Typography>
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
