// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["admin", "member"],
    default: "member",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.virtual("userId").get(function () {
  return this._id.toString();
});

userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.userId = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
