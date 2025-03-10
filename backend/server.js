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

// **Token Authentication Middleware**
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from header
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    // Verify token and attach user data to the request
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Assuming the JWT contains the user's ID
    next();
  } catch (err) {
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

function generateJWT(user) {
  return jwt.sign(
    { username: user.username, role: user.role }, // Payload (data to store in token)
    process.env.JWT_SECRET,                       // Secret key to sign the token
    { expiresIn: '7d' }                          // Token expiration time (7 days)
  );
}

// Function to verify Google token
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,  // Ensure this matches your Google Client ID
  });

  const payload = ticket.getPayload();
  return payload;  // This will return the Google user data
}


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

// **Get Current User - Regular Login**
app.get("/api/get-current-user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];  // Extract token from Authorization header
    if (!token) return res.status(400).json({ error: "Token missing" });

    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if the user logged in via Google or regular authentication
    if (decoded.username) {
      // Handle regular user (logged in via username/password)
      const user = await User.findOne({ username: decoded.username });
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.json({ username: user.username, role: user.role });
    } else if (decoded.email) {
      // Handle Google user (logged in via Google)
      const user = await User.findOne({ username: decoded.email });
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.json({ username: user.username, role: user.role });
    }

    // If neither, return an error
    return res.status(400).json({ error: "Invalid token" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error fetching current user" });
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

    // Directly generate the JWT
    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// **Google Login Route**
app.post("/api/google-login", async (req, res) => {
  try {
    const { token: googleToken } = req.body; // Rename to avoid conflict

    // Verify the Google token and fetch user data
    const googleUser = await verifyGoogleToken(googleToken); // Assume you have a function to verify Google token
    
    // Check if user exists in your database
    let user = await User.findOne({ username: googleUser.email });
    
    if (!user) {
      // If the user doesn't exist, create a new user
      user = new User({
        username: googleUser.email,
        role: 'member',  // Default role for new users (could be 'admin' for specific cases)
        password: '',    // Google login users don't need a password
      });
      await user.save();
    }

    // Generate a JWT for the Google login user
    const jwtToken = generateJWT(user); // Renaming to avoid conflict with googleToken

    res.json({
      token: jwtToken,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});


app.post("/api/signup", async (req, res) => {
  try {
    const { username, password, email, name } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    // Check if email already exists (you can decide whether this is necessary or not)
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ error: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default role to 'member'
    const role = 'member';  // Everyone starts as member

    // Create new user
    const newUser = new User({ username, email, name, password: hashedPassword, role });
    console.log("✅ Created user object:", newUser);

    // Try saving user
    await newUser.save();
    console.log("✅ User saved successfully:", newUser);

    res.json({ message: "User registered successfully.", role: newUser.role });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// **Admin Assign Role Route**
app.post("/api/assign-role", async (req, res) => {
  try {
    const { username, newRole } = req.body;
    
    // List of default admins
    const defaultAdmins = ["defaultadmin1", "defaultadmin2", "defaultadmin3"];
    
    // Ensure that only an admin can assign roles
    const loggedInUser = await User.findById(req.userId); // Assume you are validating JWT token and extracting userId
    if (loggedInUser.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: Only admins can assign roles" });
    }

    // If trying to modify default admins, deny the request
    if (defaultAdmins.includes(username) && newRole !== "admin") {
      return res.status(400).json({ error: "Cannot change role of default admin" });
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

app.put('/api/users/assign-role', async (req, res) => {
  try {
    const { username, role } = req.body;
    
    // Find the user and update their role
    const user = await User.findOneAndUpdate({ username }, { role }, { new: true });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ error: "Error updating role" });
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
