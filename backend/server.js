const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});
const channels = new Map();
const onlineUsers = new Map();

// Attach io to the app for use in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId; // Save on socket for cleanup on disconnect
    console.log(`User ${userId} is online with socket id: ${socket.id}`);
  });

  socket.on("joinChannel", (channel) => {
    socket.join(channel);
    if (!channels.has(channel)) {
      channels.set(channel, new Set());
    }
    channels.get(channel).add(socket.id);
    console.log(`User ${socket.id} joined channel: ${channel}`);
  });

  socket.on("joinDM", (dmData) => {
    if (!dmData || !dmData.users || !Array.isArray(dmData.users)) {
      console.error("Invalid DM room data:", dmData);
      return;
    }

    const users = dmData.users;
    const dmRoom = `dm_${users.sort().join("_")}`;
    socket.join(dmRoom);
    console.log(`User ${socket.id} joined DM Room: ${dmRoom}`);
  });

  // Direct message handling with database persistence
  socket.on("sendDirectMessage", async (messageData) => {
    if (
      !messageData.senderId ||
      !messageData.receiverId ||
      !messageData.content
    ) {
      console.error("Invalid direct message data", messageData);
      return;
    }

    try {
      // Save the message to the database
      const newMessage = new PrivateMessage({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        sender: messageData.sender || messageData.senderId,
        timestamp: messageData.timestamp || new Date(),
      });

      const savedMessage = await newMessage.save();
      console.log("Message saved to database:", savedMessage);

      // Use the saved message with database ID
      messageData = savedMessage;

      // Continue with broadcasting...
    } catch (error) {
      console.error("Error saving direct message:", error);
    }
  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("typing", (data) => {
    console.log("Typing indication:", data);

    if (data.recipient) {
      // DM typing
      const recipientSocketId = onlineUsers.get(data.recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("userTyping", data);
      }
    } else if (data.channel) {
      // Channel typing
      io.to(data.channel).emit("userTyping", data);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from online users
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} is now offline`);
    }

    // Remove from all channels
    channels.forEach((users, channel) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        console.log(`Removed user ${socket.id} from channel ${channel}`);
      }
    });
  });
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
