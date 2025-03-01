const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

// Attach io to the app for use in controllers
app.set("io", io);

// Socket.IO event handlers
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

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));
