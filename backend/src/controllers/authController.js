const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const { jwtSecret, googleClientId } = require("../config/config");


const client = new OAuth2Client(googleClientId);


function generateJWT(user) {
  return jwt.sign({ username: user.username, role: user.role }, jwtSecret, { expiresIn: "7d" });
}

exports.signup = async (req, res) => {
  try {
    const { username, password, role } = req.body; // Ensure role is extracted from req.body
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    res.json({ message: "User registered successfully", role });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ error: "Invalid username or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid username or password" });

    const token = jwt.sign(
      { username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    // Use Google email as the username
    let user = await User.findOne({ username: payload.email });
    if (!user) {
      // Create a new user with default role "member"
      user = new User({
        username: payload.email,
        role: "member",
        password: "", // No password for Google login
      });
      await user.save();
    }
    const jwtToken = generateJWT(user);
    res.json({ token: jwtToken, username: user.username, role: user.role });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
};