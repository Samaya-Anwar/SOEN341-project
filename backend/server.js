const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("userConnected", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} is online with socket id: ${socket.id}`);
  });
  socket.on("joinChannel", (channel) => {
    socket.join(channel);
  });
  socket.on("joinPrivateChat", (userId) => {
    if (!userId || typeof userId !== "string") return;
    socket.join(userId);
  });
  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
