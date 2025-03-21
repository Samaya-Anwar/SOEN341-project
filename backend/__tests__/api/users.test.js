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

test("✅ Should authenticate user and return JWT token", async () => {
  const loginData = {
    username: "zak",
    password: "zak",
  };

  const res = await request(app).post("/api/login").send(loginData);

  // Check if the response status is 200
  expect(res.status).toBe(200);
  // Check if JWT token is in the response
  expect(res.body).toHaveProperty("token");
  expect(typeof res.body.token).toBe("string");
});
