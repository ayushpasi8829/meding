const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const { fullname, email, mobile, countryCode, location, reason } = req.body;

  if (!fullname || !email || !mobile || !countryCode || !location || !reason) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  // const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
  const otp = 123456; // For testing purposes, use a fixed OTP
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    user = new User({
      fullname,
      email,
      mobile,
      countryCode,
      location,
      reason,
      otp,
      otpExpiresAt,
      role: "user",
    });
    await user.save();

    //await sendOtpToMobile(countryCode + mobile, otp);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        otp: user.otp,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.otpVerify = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile and OTP are required" });
  }

  try {
    const user = await User.findOne({ mobile });

    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isMobileVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY");

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        mobile: user.mobile,
        token,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ success: false, message: err.message });
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
