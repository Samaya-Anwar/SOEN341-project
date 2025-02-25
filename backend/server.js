const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.on("message", (message) => {
    console.log("received: %s", message);
    ws.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
