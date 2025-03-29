const PrivateMessage = require("../models/PrivateMessage");
exports.createPrivateChat = async (req, res) => {
  try {
    console.log("Creating private message with data:", req.body);
    const { senderId, receiverId, content, sender } = req.body;

    if (!senderId || !receiverId || !content) {
      return res.status(400).json({
        error: "Sender ID, receiver ID, and message content are required",
        received: req.body,
      });
    }
    const newMessage = new PrivateMessage({
      senderId,
      receiverId,
      content,
      sender: sender || senderId,
    });
    const savedMessage = await newMessage.save();
    console.log("Saved private message:", savedMessage);
    const io = req.app.get("io");
    const users = [senderId, receiverId].sort();
    const roomName = `dm_${users[0]}_${users[1]}`;
    io.to(roomName).emit("newMessage", savedMessage);
    io.emit("privateChatUpdated");
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("Error creating private message:", err);
    res.status(500).json({
      error: "Could not create private message",
      details: err.message,
    });
  }
};
exports.getPrivateChat = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    console.log(`Fetching private messages for user: ${userId}`);
    const messages = await PrivateMessage.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: 1 });

    console.log(`Found ${messages.length} private messages for user ${userId}`);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching private messages:", err);
    res.status(500).json({ error: "Could not fetch private messages" });
  }
};
exports.deletePrivateChat = async (req, res) => {
  try {
    const { messageId } = req.params;
    await PrivateMessage.findByIdAndDelete(messageId);
    const io = req.app.get("io");
    io.emit("messageDeleted", messageId);
    res.json({ message: "Private message deleted" });
  } catch (err) {
    console.error("Error deleting private message:", err);
    res.status(500).json({ error: "Could not delete private message" });
  }
};
