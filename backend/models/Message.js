// models/Message.js
// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model('Message', messageSchema);
