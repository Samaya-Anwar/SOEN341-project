require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5001,
  mongoURI: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
};
