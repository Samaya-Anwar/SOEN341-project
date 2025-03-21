const User = require("../models/User");
const PrivateChat = require("../models/PrivateChat");

// Search for users based on a query (e.g., username)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query)
      return res.status(400).json({ error: "Query parameter is required" });
      
    // Use a case-insensitive regex to search for users by username
    const users = await User.find({
      username: { $regex: query, $options: "i" }
    });
    res.json(users);
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Error searching users" });
  }
};

// Create a private chat (or return existing one) between two participants
exports.createPrivateChat = async (req, res) => {
  try {
    const { participants } = req.body;
    // participants should be an array with at least 2 objects: { userId, username }
    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: "At least two participants are required" });
    }
    
    // Create a sorted array of participant IDs for consistency
    const sortedIds = participants.map(p => p.userId).sort();
    
    // Check if a chat with these participants already exists
    let existingChat = await PrivateChat.findOne({ participantIds: sortedIds });
    if (existingChat) {
      return res.json(existingChat);
    }
    
    // Create a new private chat
    const newChat = new PrivateChat({
      participants,
      participantIds: sortedIds
    });
    await newChat.save();
    
    // Optionally, emit a socket event to notify clients
    const io = req.app.get("io");
    io.emit("privateChatUpdated", newChat);
    
    res.status(201).json(newChat);
  } catch (err) {
    console.error("Error creating private chat:", err);
    res.status(500).json({ error: "Could not create private chat" });
  }
};

// Delete a private chat by its ID
exports.deletePrivateChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    await PrivateChat.deleteOne({ _id: chatId });
    res.json({ message: "Private chat deleted" });
  } catch (err) {
    console.error("Error deleting private chat:", err);
    res.status(500).json({ error: "Could not delete private chat" });
  }
};

// Fetch all private chats for a given user
exports.getPrivateChats = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ error: "User ID is required" });
    
    // Find chats where the given user is a participant.
    // Assumes that participantIds is an array field in the PrivateChat model.
    const chats = await PrivateChat.find({ participantIds: userId });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching private chats:", err);
    res.status(500).json({ error: "Could not fetch private chats" });
  }
};