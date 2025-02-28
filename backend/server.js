require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// **Schemas & Models**
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "member"], default: "member" },
});
const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  channel: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);

const channelSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
});
const Channel = mongoose.model("Channel", channelSchema);

// **Signup Route**
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = Math.random() < 0.1 ? "admin" : "member"; // 10% chance of admin

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.json({ message: "User registered successfully", role });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// **Login Route**
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(400).json({ error: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid username or password" });

    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// **Send Message**
app.post("/api/messages", async (req, res) => {
  try {
    const { sender, content, channel } = req.body;
    if (!sender || !content || !channel) return res.status(400).json({ error: "Missing required fields" });

    const newMessage = new Message({ sender, content, channel });
    await newMessage.save();

    io.to(channel).emit("newMessage", newMessage); // Emit to correct channel
    res.status(201).json(newMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Message could not be sent" });
  }
});

// **Delete Message (Admins Only)**
app.delete("/api/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndDelete(id);
    io.emit("messageDeleted", id); // Notify all clients to remove message
    res.json({ message: "Message deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete message" });
  }
});

// **Fetch Messages for a Channel**
app.get("/api/messages/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    const messages = await Message.find({ channel }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

// **Create Channel (Admins Only)**
app.post("/api/channels", async (req, res) => {
  try {
    const { channel } = req.body;
    if (!channel) return res.status(400).json({ error: "Channel name is required" });

    const newChannel = new Channel({ name: channel });
    await newChannel.save();

    io.emit("channelUpdated"); // Notify clients
    res.status(201).json(newChannel);
  } catch (err) {
    res.status(500).json({ error: "Could not create channel" });
  }
});

// **Delete Channel (Admins Only)**
app.delete("/api/channels/:channel", async (req, res) => {
  try {
    const { channel } = req.params;
    await Channel.deleteOne({ name: channel });

    io.emit("channelUpdated"); // Notify clients
    res.json({ message: "Channel deleted" });
  } catch (err) {
    res.status(500).json({ error: "Could not delete channel" });
  }
});

// **Fetch All Channels**
app.get("/api/channels", async (req, res) => {
  try {
    const channels = await Channel.find();
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch channels" });
  }
});

// **Setup Socket.io**
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinChannel", (channel) => {
    socket.join(channel);
    console.log(`User joined channel: ${channel}`);
  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
