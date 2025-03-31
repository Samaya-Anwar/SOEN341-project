const express = require("express");
const router = express.Router();
const privateChatController = require("../controllers/privateChatController");

router.post("/", privateChatController.createPrivateChat);

router.get("/", privateChatController.getPrivateChats);

router.delete("/:chatId", privateChatController.deletePrivateChat);

module.exports = router;
