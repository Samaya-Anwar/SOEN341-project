const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// Send a message
router.post("/", messageController.sendMessage);

// Delete a message (admins only ideally)
router.delete("/:id", messageController.deleteMessage);

// Fetch messages for a specific channel
router.get("/:channel", messageController.getMessagesByChannel);

module.exports = router;
