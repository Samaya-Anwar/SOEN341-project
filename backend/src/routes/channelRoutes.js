const express = require("express");
const router = express.Router();
const channelController = require("../controllers/channelController.js");

// Create a channel
router.post("/", channelController.createChannel);

// Delete a channel
router.delete("/:channel", channelController.deleteChannel);

// Fetch all channels
router.get("/", channelController.getChannels);

module.exports = router;
