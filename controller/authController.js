const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const { fullname, email, mobile, countryCode, password, gender, dob } =
    req.body;

  if (
    !fullname ||
    !email ||
    !mobile ||
    !countryCode ||
    !password ||
    !gender ||
    !dob
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      fullname,
      email,
      mobile,
      countryCode,
      password: hashedPassword,
      role:'user',
      gender,
      dob,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.doctorSignup = async (req, res) => {
  const {
    fullname,
    email,
    mobile,
    countryCode,
    password,
    gender,
    dob,
    therapyCategory,
    availability, // expected as { startTime: "09:00", endTime: "17:00" }
  } = req.body;

  if (
    !fullname ||
    !email ||
    !mobile ||
    !countryCode ||
    !password ||
    !gender ||
    !dob ||
    !therapyCategory ||
    !availability ||
    !availability.startTime ||
    !availability.endTime
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      fullname,
      email,
      mobile,
      countryCode,
      password: hashedPassword,
      role: "doctor",
      gender,
      dob,
      therapyCategory,
      availability,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "Doctor registered successfully",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        therapyCategory: user.therapyCategory,
        availability: user.availability,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY", {
      expiresIn: "1h",
    });
    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
