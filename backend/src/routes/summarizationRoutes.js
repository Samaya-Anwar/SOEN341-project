const express = require("express");
const router = express.Router();
const summarizationController = require("../controllers/summarizationController");

router.get("/:channel", summarizationController.getSummary);

module.exports = router;
