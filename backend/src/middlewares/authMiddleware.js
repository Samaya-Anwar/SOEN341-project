const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");

exports.authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.id;  // we include id in our token
    req.user = decoded;       // also attach entire decoded payload if needed
    next();
  } catch (err) {
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};