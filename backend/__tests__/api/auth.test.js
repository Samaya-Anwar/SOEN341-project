const request = require("supertest");
const app = require("../../app"); // Import Express app (not server)
const User = require("../../src/models/User");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({}); // Clear messages before each test
  app.set("io", { to: jest.fn().mockReturnThis(), emit: jest.fn() }); // ✅ Mock WebSocket
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close(); // ✅ Close MongoDB connection
});

//Checks if sign
test("✅ Should signup a user successfully", async () => {
  const userData = {
    username: "testuser",
    password: "testpws",
    role: "member",
  };

  const res = await request(app).post("/api/signup").send(userData);

  expect(res.status).toBe(200);

  const savedUser = await User.findOne({
    username: "testuser",
  });
  expect(savedUser).toBeTruthy();
});
