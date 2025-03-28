const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");
const PrivateMessage = require("./src/models/PrivateChat");
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});
const channels = new Map();
const onlineUsers = new Map();

// Attach io to the app for use in controllers
app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId; // Save on socket for cleanup on disconnect
    console.log(`User ${userId} is online with socket id: ${socket.id}`);
  });
  //updated the joinchannel socket
  socket.on("joinChannel", (channel) => {
    socket.join(channel);
    if (!channels.has(channel)) {
      channels.set(channel, new Set());
    }
    channels.get.apply(channel).add(socket.ID);
    console.log(`User ${socket.ID} joined channel: ${channel}`);
  });
  socket.on("privateMessage", async ({ senderId, receiverId, content }) => {
    try {
      // Create a new private message record for all registered users
      const newMessage = new PrivateMessage({
        senderID: senderId,
        receiverID,
        content,
      });
      await newMessage.save();

      // If the recipient is online, deliver the message in real time
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newPrivateMessage", {
          senderId,
          content,
          _id: newMessage._id,
          createdAt: newMessage.createdAt,
        });
        console.log(
          `Private message from ${senderId} to ${receiverId}: ${content}`
        );
      } else {
        console.log(
          `User ${receiverId} is offline. Private message from ${senderId} saved to DB.`
        );
      }
      // Optionally, acknowledge the sender that the message was processed
      socket.emit("privateMessageSent", { message: newMessage });
    } catch (err) {
      console.error("Error sending private message:", err);
      socket.emit("error", { error: "Could not send private message" });
    }
  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
