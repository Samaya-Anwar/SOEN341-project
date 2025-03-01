const Message = require("../models/Message");

exports.sendMessage = async (req, res) => {
  try {
    const { sender, content, channel } = req.body;
    if (!sender || !content || !channel)
      return res.status(400).json({ error: "Missing required fields" });

    const newMessage = new Message({ sender, content, channel });
    await newMessage.save();

    const io = req.app.get("io");
    io.to(channel).emit("newMessage", newMessage); // Emit to correct channel
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Message could not be sent" });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);

    const io = req.app.get("io");
    io.emit("messageDeleted", id); // Notify all clients to remove message
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete message" });
  }
};

exports.getMessagesByChannel = async (req, res) => {
  try {
    const { channel } = req.params;
    const messages = await Message.find({ channel }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch messages" });
  }
};
