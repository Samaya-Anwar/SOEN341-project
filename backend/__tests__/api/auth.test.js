const request = require("supertest");
const app = require("../../app");
const User = require("../../src/models/User");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({});
  app.set("io", { to: jest.fn().mockReturnThis(), emit: jest.fn() });
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

//Checks for signup
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

//Checks for login
test("✅ Should login a user successfully", async () => {
  await request(app).post("/api/signup").send({
    username: "testuser",
    password: "testpws",
    role: "member",
  });

  // Then try to login
  const res = await request(app).post("/api/login").send({
    username: "testuser",
    password: "testpws",
  });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("token");
});
