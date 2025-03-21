const request = require("supertest");
const app = require("../../app"); // Import Express app (not server)
const Channel = require("../../src/models/Channel");
const mongoose = require("mongoose");

beforeEach(async () => {
  await Channel.deleteMany({}); // Clear messages before each test
  app.set("io", { to: jest.fn().mockReturnThis(), emit: jest.fn() }); // ✅ Mock WebSocket
});

afterAll(async () => {
  await Channel.deleteMany({});
  await mongoose.connection.close(); // ✅ Close MongoDB connection
});

test("✅ Should create a new channel", async () => {
  const channelData = { channel: "General" };

  const res = await request(app).post("/api/channels").send(channelData);

  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("name", "General");
});

test("❌ Should return error if channel name is missing", async () => {
  const channelData = {}; // Missing channel name

  const res = await request(app).post("/api/channels").send(channelData);

  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("error", "Channel name is required");
});
