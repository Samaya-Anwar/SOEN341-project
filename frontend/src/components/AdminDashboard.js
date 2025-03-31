import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
} from '@mui/material';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; 

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const token = localStorage.getItem('token');

  // Fetch all users on mount
  useEffect(() => {
    axios.get(`${API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setUsers(res.data);
        setEditedUsers(res.data);
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, [token]);

  const handleRoleChange = (username, checked) => {
    const updated = editedUsers.map((user) =>
      user.username === username
        ? { ...user, role: checked ? 'admin' : 'member' }
        : user
    );
    setEditedUsers(updated);
  };

  const handleSaveChanges = async () => {
    try {
      const updatePromises = editedUsers.map((user) => {
        const original = users.find(u => u.username === user.username);
        if (original && original.role !== user.role) {
          // Only send update if role has changed
          return axios.put(
            `${API_URL}/api/users/assign-role`,
            { username: user.username, role: user.role },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      setSaveMessage('Changes saved successfully.');
      // Optionally, refresh user list from backend
      const res = await axios.get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setEditedUsers(res.data);
    } catch (err) {
      console.error('Error saving changes:', err);
      setSaveMessage('Error saving changes.');
    }
  };

  // Filter out any user objects missing a username
  const filteredUsers = editedUsers.filter((user) =>
    user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simple sort: letters first, then numbers
  const sortedUsers = filteredUsers.sort((a, b) => {
    const aName = a.username.toLowerCase();
    const bName = b.username.toLowerCase();
    const isNumA = /^\d/.test(aName);
    const isNumB = /^\d/.test(bName);

    if (isNumA && !isNumB) return 1;
    if (!isNumA && isNumB) return -1;
    return aName.localeCompare(bName);
  });

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: '#333',
        color: 'white',
        minHeight: '100vh',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="h6" gutterBottom>
        Manage User Roles
      </Typography>
      <TextField
        label="Search by Username"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        sx={{ backgroundColor: '#2c2c2c', color: 'white', mb: 3 }}
        InputLabelProps={{ style: { color: 'white' } }}
        InputProps={{ style: { color: 'white' } }}
      />
      {sortedUsers.map((user) => (
        <Box key={user.username} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ flexGrow: 1 }}>
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
      <Button variant="contained" color="primary" onClick={handleSaveChanges}>
        Save Changes
      </Button>
      {saveMessage && (
        <Typography sx={{ mt: 2 }}>
          {saveMessage}
        </Typography>
      )}
    </Box>
  );
};

export default AdminDashboard;