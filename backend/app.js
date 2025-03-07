const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
const authRoutes = require("./src/routes/authRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const channelRoutes = require("./src/routes/channelRoutes");
const summarizationRoutes = require("./src/routes/summarizationRoutes");


app.use("/api", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/summarization", summarizationRoutes);


// Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Messaging App API!");
});

module.exports = app;
