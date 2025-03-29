const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, default: ""  },
  role: { type: String, enum: ["admin", "member"], default: "member" },
});

module.exports = mongoose.model("User", userSchema);
