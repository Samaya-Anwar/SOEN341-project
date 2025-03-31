const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/", messageController.sendMessage);

router.delete("/:id", messageController.deleteMessage);

router.get("/:channel", messageController.getMessagesByChannel);

module.exports = router;
