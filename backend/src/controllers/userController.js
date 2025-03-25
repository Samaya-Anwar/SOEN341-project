const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.json(users);
  } catch (err) {
    console.error("Could not fetch users:", err);
    res.status(500).json({ error: "Could not fetch users" });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { username, role } = req.body;
    const user = await User.findOneAndUpdate(
      { username },
      { role },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Error updating role" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header
    if (!token) return res.status(400).json({ error: "Token missing" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;

    if (decoded.username) {
      user = await User.findOne({ username: decoded.username });
    } else if (decoded.email) {
      user = await User.findOne({ username: decoded.email });
    }

    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ username: user.username, role: user.role });
  } catch (err) {
    console.error("Error fetching current user:", err);
    return res.status(500).json({ error: "Error fetching current user" });
  }
};
