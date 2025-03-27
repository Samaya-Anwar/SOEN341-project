const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/assign-role", authenticateToken, adminController.assignRole);

module.exports = router;