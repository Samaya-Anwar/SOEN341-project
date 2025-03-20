const request = require("supertest");
const app = require("../../app"); // Import Express app (not server)
const Message = require("../../src/models/Message");
const mongoose = require("mongoose");

beforeEach(async () => {
  await Message.deleteMany({}); // Clear messages before each test
  app.set("io", { to: jest.fn().mockReturnThis(), emit: jest.fn() }); // ✅ Mock WebSocket
});

afterAll(async () => {
  await Message.deleteMany({});
  await mongoose.connection.close(); // ✅ Close MongoDB connection
});

test("✅ Should store a message in the database", async () => {
  const messageData = {
    sender: "samaya",
    content: "Hello!",
    channel: "Channel1",
  };

  const res = await request(app).post("/api/messages").send(messageData);

  expect(res.status).toBe(201);

  const savedMessage = await Message.findOne({ sender: "samaya" });
  expect(savedMessage).toBeTruthy();
  expect(savedMessage.content).toBe("Hello!");
  expect(savedMessage.channel).toBe("Channel1"); // ✅ Fix incorrect expected value
});
