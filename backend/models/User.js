// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  role: { type: String, enum: ['Admin', 'Member'], required: true },
});

module.exports = mongoose.model('User', userSchema);
