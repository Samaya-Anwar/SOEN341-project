require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const OpenAI = require('openai');


const app = express();
app.use(express.json());
app.use(cors());

// Load environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error(err));

// Import models
const User = require('./models/User');
const Channel = require('./models/Channel');
const Message = require('./models/Message');

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/register', async (req, res) => {
  try {
    const { username, role } = req.body;

    // Validate role
    if (!['Admin', 'Member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Use Admin or Member.' });
    }

    // Create user
    const user = new User({ username, role });
    await user.save();
    
    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});
// Middleware to authenticate users (simulated)
app.use(async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (mongoose.Types.ObjectId.isValid(userId)) {
    req.user = await User.findById(userId);
  } else {
    req.user = null; // Invalid user ID
  }

  next();
});

// Create Channel (Admin only)
app.post('/channels', async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
  const channel = new Channel({ name: req.body.name });
  await channel.save();
  res.status(201).json(channel);
});

// Fetch Channels
app.get('/channels', async (req, res) => {
  const query = req.user.role === 'Admin' ? {} : { deleted: false };
  const channels = await Channel.find(query);
  res.json(channels);
});

// Send a Message
app.post('/channels/:channelId/messages', async (req, res) => {
  const { content } = req.body;
  const message = new Message({
    channelId: req.params.channelId,
    senderId: req.user._id,
    content,
  });
  await message.save();
  res.status(201).json(message);
});

// Fetch Messages
app.get('/channels/:channelId/messages', async (req, res) => {
  const messages = await Message.find({ channelId: req.params.channelId, deleted: false }).sort({ createdAt: -1 });
  res.json(messages);
});

// Fetch Chat Summary
app.get('/channels/:channelId/summary', async (req, res) => {
  try {
    const { channelId } = req.params;
    // Retrieve last 20 non-deleted messages, sorted descending by creation time
    let messages = await Message.find({ channelId, deleted: false })
      .sort({ createdAt: -1 })
      .limit(20);
      
    // Reverse to have the oldest first
    messages = messages.reverse();

    // If there are no messages, return a default response
    if (messages.length === 0) {
      return res.json({ summary: "No messages to summarize." });
    }

    // Concatenate message contents to build the conversation text
    const chatContent = messages.map(msg => msg.content).join("\n");

    // Create prompt messages for the Chat API:
    const promptMessages = [
      {
        role: "system",
        content: "You are a helpful assistant. Summarize the following chat conversation in a concise paragraph."
      },
      {
        role: "user",
        content: chatContent
      }
    ];

    // Call the new OpenAI Chat Completions API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: promptMessages,
      max_tokens: 150,
      temperature: 0.5
    });

    // Extract the summary from the response
    const summary = response.choices[0].message.content.trim();
    res.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ message: "Error generating summary", error });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

