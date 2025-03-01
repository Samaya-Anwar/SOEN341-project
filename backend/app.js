const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const channelRoutes = require("./routes/channelRoutes");

app.use("/api", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channels", channelRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Messaging App API!");
});

module.exports = app;
