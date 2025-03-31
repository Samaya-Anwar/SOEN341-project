const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// GET all users
router.get("/", userController.getAllUsers);

// PUT update user role
router.put("/assign-role", userController.assignRole);

// GET current user
router.get("/get-current-user", userController.getCurrentUser);

module.exports = router;