const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { port } = require("./src/config/config");

const server = http.createServer(app);

//not sure if this would work
const users = new Map();// 
const channels = new Map(); //
const privateMessages = new Map(); //
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

socket.on("privateMessage", ({ senderID, receiverID, message }) => {
  console.log(`Private message from ${senderID} to ${receiverID}: ${message}`);
  // Look up the receiver's socket ID in the users map
  const receiverSocketId = users.get(receiverID);
  if (receiverSocketId) {
    // Emit the message to the receiver
    io.to(receiverSocketId).emit("newMessage", {
      sender: senderID,
      receiver: receiverID,
      content: message,
      timestamp: new Date().toISOString(),
    });
    // Optionally, also emit back to the sender to update their UI
    io.to(socket.id).emit("newMessage", {
      sender: senderID,
      receiver: receiverID,
      content: message,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log(`Receiver ${receiverID} is not connected.`);
  }
});
    
    const receiverSocket = users.get(receiverID);
    if(receiverSocket){
      io.to(receiverSocket).emit("newPrivateMessage",{
        sender: senderID,
      content: message,
      //Questionable
      timestamp: new Date()
    });
    }

    socket.emit("privateMessageSent", {
      receiver: receiverID,
      content: message,
      //Questionable
      timestamp: new Date()
    })


  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});


server.listen(port, () => console.log(`🚀 Server running on port ${port}`));