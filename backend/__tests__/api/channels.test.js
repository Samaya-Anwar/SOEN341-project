const request = require("supertest");
const app = require("../../app"); // Import Express app (not server)
const Channel = require("../../src/models/Channel");
const mongoose = require("mongoose");

beforeEach(async () => {
  await Channel.deleteMany({});
  app.set("io", { to: jest.fn().mockReturnThis(), emit: jest.fn() }); // ✅ Mock WebSocket
});

afterAll(async () => {
  await Channel.deleteMany({});
  await mongoose.connection.close();
});

//Checks for creation of channel
test("✅ Should create a channel successfully", async () => {
  const channelData = {
    channel: "testChannel",
  };

  const res = await request(app).post("/api/channels").send(channelData);

  expect(res.status).toBe(201);

  const savedChannel = await Channel.findOne({ name: "testChannel" });
  expect(savedChannel).toBeTruthy();
});

//Checks if message is sent to the DB
test("✅ Should get channels successfully", async () => {
  const res = await request(app).get("/api/channels");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});
