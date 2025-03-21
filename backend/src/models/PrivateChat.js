const mongoose = require("mongoose");

const PrivateChatSchema = new mongoose.Schema({
  participants: [
    {
      userId: { type: String, required: true },
      username: { type: String, required: true }
    }
  ],
  // Store sorted participant IDs for quick lookup
  participantIds: [{ type: String, required: true }]
}, { timestamps: true });

module.exports = mongoose.model("PrivateChat", PrivateChatSchema);
