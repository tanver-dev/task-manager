const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Helper to send cookie
const sendToken = (res, user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
    maxAge: 1000 * 60 * 60 * 24 * Number(process.env.COOKIE_EXPIRES),
  });

  res.status(200).json({
    message: "Success",
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// Register
exports.registerUser = async (req, res) => {
  if (req.cookies?.token)
    return res.status(400).json({ message: "Plz logout first" });
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  const userExists = await User.findOne({ email });
  if (userExists)
    return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ name, email, password, role });
  sendToken(res, user);
};

// Login
exports.loginUser = async (req, res) => {
  if (req.cookies?.token)
    return res.status(400).json({ message: "Plz logout first" });

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  sendToken(res, user);
};

// Logout
exports.logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: true,
    sameSite: "None",
  });
  res.status(200).json({ message: "Logged out" });
};

exports.getMe = (req, res) => {
  res.status(200).json({
    message: "user is logged in.",
    user: req.user,
  });
};
