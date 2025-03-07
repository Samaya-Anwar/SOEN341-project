require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client("198072547047-vtauj833icvolq5cs13i4ted4gs9a6d8.apps.googleusercontent.com");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: "http://localhost:3000" }));
//app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// **Schemas & Models**
const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["admin", "member"], default: "member" },

  googleId: { type: String, unique: true, sparse: true }, // Google User ID
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  picture: { type: String },
  password: { type: String, required: false, default: null }, // ✅ Make optional
  
  username: { type: String, unique: true, required: true }, // Ensure username field is here
});
const User = mongoose.model("User", userSchema);
module.exports = User;

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

// **Fetch All Users**
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    res.json(users); // Send users as a JSON response
  } catch (err) {
    res.status(500).json({ error: "Could not fetch users" });
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

// **Google Login Route**
app.post('/api/google-login', async (req, res) => {
  try {
      const { token } = req.body;

      if (!token) {
          return res.status(400).json({ error: "Missing token" });
      }

      // Verify Google token and get user info
      const decodedToken = jwt.decode(token);
      console.log("Decoded Token:", decodedToken);  // ✅ Log token

      const { email, name } = decodedToken;
      console.log('Email:', email);

      // Set username to email or fallback to a safe value
      let username = email;  // Ensure that username is set to email

      if (!username) {
        // Fallback if email is not available (but this shouldn't happen)
        username = `user_${Date.now()}`;
      }
      console.log('Username:', username);

    // Check if the user already exists in the database
    let existingUser = await User.findOne({ username });

    // If user doesn't exist, create a new user
    if (!existingUser) {
      const newUser = new User({
        username,  // Use email as username
        email,
        name,
        role: 'member',  // Set default role, can be changed as needed
      });

      await newUser.save();
      console.log('New user created:', newUser);
      existingUser = newUser;  // Set the existing user to the new one we just created
    }

    // Send the user info and token to the frontend
    res.json({
      token: jwt.sign({ id: existingUser._id }, 'your_jwt_secret', { expiresIn: '1h' }),
      username: existingUser.username,
      role: existingUser.role,
    });
  } catch (error) {
    console.error('Error during Google login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// **Signup Route**
app.post("/api/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default role to 'member'
    const role = 'member';  // Everyone starts as member

    // Create and save new user
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    // Respond back without revealing internal role logic
    res.json({ message: "User registered successfully. You are assigned a member role." });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// **Admin Assign Role Route** (for admin to assign a role)
app.post("/api/assign-role", async (req, res) => {
  try {
    const { username, newRole } = req.body;

    // Ensure that only an admin can assign roles
    const loggedInUser = await User.findById(req.userId); // Assume you are validating JWT token and extracting userId
    if (loggedInUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Only admins can assign roles" });
    }

    // Find the user and update their role
    const userToUpdate = await User.findOne({ username });
    if (!userToUpdate) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure only 'member' users can be promoted to 'admin'
    if (newRole === 'admin' && userToUpdate.role === 'admin') {
      return res.status(400).json({ error: "User is already an admin" });
    }

    userToUpdate.role = newRole; // newRole could be 'admin' or 'member'
    await userToUpdate.save();

    res.status(200).json({ message: `${username}'s role updated to ${newRole}` });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

app.put("/api/users/assign-role", async (req, res) => {
  const { username, role } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = role; // Update the role
    await user.save();

    res.json({ message: "User role updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating user role" });
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
