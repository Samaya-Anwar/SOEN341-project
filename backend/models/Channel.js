// models/Channel.js
const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: String,
  deleted: { type: Boolean, default: false },
});

module.exports = mongoose.model('Channel', channelSchema);
