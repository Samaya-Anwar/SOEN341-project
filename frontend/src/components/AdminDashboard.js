import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, FormControlLabel, Checkbox, Box, TextField } from '@mui/material';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);  // To store current logged-in user

  // List of default admins that cannot have their role removed
  const defaultAdmins = ["defaultadmin1", "defaultadmin2", "defaultadmin3"];

  useEffect(() => {
    const token = localStorage.getItem("token"); // Retrieve stored token
  
    if (!token) {
      console.error("No token found, user might not be logged in.");
      return;
    }
  
    // Fetch all users
    axios.get("http://localhost:5001/api/users", {
      headers: { Authorization: `Bearer ${token}` }, // Attach token
    })
    .then((response) => {
      setUsers(response.data);
      setEditedUsers(response.data);
      console.log("Fetched Users:", response.data);
    })
    .catch((error) => console.error("Error fetching users:", error));
  
    // Fetch current user
    axios.get("http://localhost:5001/api/get-current-user", {
      headers: { Authorization: `Bearer ${token}` }, // Attach token
    })
    .then((response) => {
      console.log("Current User Data:", response.data);
      setCurrentUser(response.data);
    })
    .catch((error) => console.error("Error fetching current user:", error));
  }, []);  

  useEffect(() => {
    if (currentUser) {
      console.log("Current User Loaded:", currentUser);
    }
  }, [currentUser]);

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

  // Sort the users: first by alphabetical order, then by numbers (users starting with numbers will come after letters)
  const sortedUsers = filteredUsers.sort((a, b) => {
    const usernameA = a.username.toLowerCase();
    const usernameB = b.username.toLowerCase();

    const isANumber = /^\d/.test(usernameA);
    const isBNumber = /^\d/.test(usernameB);

    if (!isANumber && !isBNumber) {
      return usernameA.localeCompare(usernameB);
    } else if (isANumber && !isBNumber) {
      return 1; // Numbers come after letters
    } else if (!isANumber && isBNumber) {
      return -1; // Letters come before numbers
    }
    return 0;
  });

  // Debugging logs for the conditions
  sortedUsers.forEach((user) => {
    console.log("Checking conditions for:", user.username);
    console.log("Current User Role:", currentUser?.role);
    console.log("Is Current User Admin:", currentUser?.role === 'admin');
    console.log("Is Current User Not Default Admin:", !defaultAdmins.includes(currentUser?.username));
    console.log("Is Target User Admin:", user.role === 'admin');
    console.log("Is Target User Default Admin:", defaultAdmins.includes(user.username));
    console.log("Condition Check:", 
      (currentUser?.role === 'admin' && !defaultAdmins.includes(currentUser?.username) && user.role === 'admin')
    );
  });  

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

      <Box sx={{
        width: '100%',
        maxWidth: 600,
        backgroundColor: '#2c2c2c',
        padding: 2,
        borderRadius: 2,
        boxShadow: 2,
      }}>
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

        <Box sx={{ width: '100%' }}>
          {sortedUsers.map((user) => (
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
                    disabled={
                      // Default admins cannot uncheck their admin role
                      defaultAdmins.includes(user.username) ||
                      // If the logged-in user is NOT a default admin, they cannot change any admin's role
                      (currentUser?.role === 'admin' && user.role === 'admin' && !defaultAdmins.includes(currentUser.username))
                    }
                  />
                }
                label="Admin"
              />
            </Box>
          ))}
        </Box>
      </Box>

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
