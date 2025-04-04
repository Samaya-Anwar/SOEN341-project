const PrivateChat = require("../models/PrivateChat");
const User = require("../models/User");

exports.createPrivateChat = async (req, res) => {
  try {
    const { participants } = req.body;

    if (!participants || participants.length !== 2) {
      return res.status(400).json({
        error: "Exactly two participants are required for a private chat",
      });
    }
    const existingChat = await PrivateChat.findOne({
      participants: { $all: participants, $size: 2 },
    });

    if (existingChat) {
      return res.status(400).json({
        error: "A private chat between these participants already exists",
      });
    }
    const newPrivateChat = new PrivateChat({ participants });
    await newPrivateChat.save();

    const io = req.app.get("io");
    io.emit("privateChatUpdated");
    res.status(201).json(newPrivateChat);
  } catch (err) {
    res.status(500).json({ error: "Could not create private chat" });
  }
};

exports.getPrivateChats = async (req, res) => {
  try {
    const { username } = req.query;
    let chats;
    if (username) {
      chats = await PrivateChat.find({ participants: username });
    } else {
      chats = await PrivateChat.find();
    }

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch private chats" });
  }
};

exports.deletePrivateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    await PrivateChat.deleteOne({ _id: chatId });

    const io = req.app.get("io");
    io.emit("privateChatUpdated");
    res.json({ message: "Private chat deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete private chat" });
  }
};
