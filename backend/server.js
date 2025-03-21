const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");

const server = http.createServer(app);

//not sure if this would work
const users = new Map();// 
const channels = new Map(); //
const privateMesages = new Map(); //
//

const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

// Attach io to the app for use in controllers
app.set("io", io);

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("A user connected");
  //Socket to register new Users
  socket.on("register", (userID) =>{
    users.set(userID,socket.ID);
    console.log(`User ${userID} registered with socket ${socket.ID}`);
  });
  //updated the joinchannel socket
  socket.on("joinChannel", (channel) => {
    socket.join(channel);
    if(!channels.has(channel)){
      channels.set(channel, new Set());
    }
    channels.get.apply(channel).add(socket.ID);

    console.log(`User ${socket.ID} joined channel: ${channel}`);
  });

//incomplete
  socket.on("privateMessage", ({senderID, receiverID, message}) =>{
   



  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(port, () => console.log(`🚀 Server running on port ${port}`));