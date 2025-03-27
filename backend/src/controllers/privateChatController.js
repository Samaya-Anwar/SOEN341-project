const PrivateMessage = require("../models/PrivateChat");

// Create a new private message
exports.createPrivateChat = async (req, res) => {
  try {
    const { senderID, receiverID, content } = req.body;
    if (!senderID || !receiverID || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newMessage = new PrivateMessage({ senderID, receiverID, content });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error creating private message:", err);
    res.status(500).json({ error: "Could not create private message" });
  }
};

// Get all private messages for a given user (involving the user as sender or receiver)
exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const messages = await PrivateMessage.find({
      $or: [{ senderID: userId }, { receiverID: userId }],
    });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching private messages:", err);
    res.status(500).json({ error: "Could not fetch private messages" });
  }
};

// Delete a private message
exports.deletePrivateChat = async (req, res) => {
  try {
    const { messageId } = req.params;
    await PrivateMessage.deleteOne({ _id: messageId });
    res.json({ message: "Private message deleted" });
  } catch (err) {
    console.error("Error deleting private message:", err);
    res.status(500).json({ error: "Could not delete private message" });
  }
};
