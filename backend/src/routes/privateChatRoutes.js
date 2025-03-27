const express = require("express");
const router = express.Router();
const privateChatController = require("../controllers/privateChatController");

// Create a new private message
router.post("/", privateChatController.createPrivateChat);

// Get all private messages for a user
router.get("/", privateChatController.getPrivateChat);

// Delete a private message
router.delete("/:messageId", privateChatController.deletePrivateChat);

module.exports = router;
