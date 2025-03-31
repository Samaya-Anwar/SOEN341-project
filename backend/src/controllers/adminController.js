const User = require("../models/User");

exports.assignRole = async (req, res) => {
  try {
    const { username, newRole } = req.body;

    // Define default admins that cannot have their role downgraded
    const defaultAdmins = ["defaultadmin1", "defaultadmin2", "defaultadmin3"];

    // Ensure the logged-in user is an admin (req.userId is set by the auth middleware)
    const loggedInUser = await User.findById(req.userId);
    if (!loggedInUser || loggedInUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Only admins can assign roles" });
    }

    // Prevent changing default admin roles (if applicable)
    if (defaultAdmins.includes(username) && newRole !== "admin") {
      return res.status(400).json({ error: "Cannot change role of a default admin" });
    }

    // Find the user to update
    const userToUpdate = await User.findOne({ username });
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optionally, prevent promoting an already admin user again
    if (newRole === "admin" && userToUpdate.role === "admin") {
      return res.status(400).json({ error: "User is already an admin" });
    }

    userToUpdate.role = newRole;
    await userToUpdate.save();

    res.status(200).json({ message: `${username}'s role updated to ${newRole}` });
  } catch (err) {
    console.error("Admin assign role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
};