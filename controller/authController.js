const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const otp = 123456; // Change to random in production
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        role: "user",
        otp,
        otpExpiresAt,
      });
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
    }

    await user.save();

    // Send OTP via email
    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to email",
      data: {
        email: user.email,
        otp, // Remove in production
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.otp !== otp || user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY");

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        mobile: user.mobile,
        location: user.location,
        token,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (err) {
    console.log("Error verifying OTP:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const generateReferralCode = (name) => {
  const prefix = name.split(" ")[0].substring(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${random}`;
};

exports.register = async (req, res) => {
  const { fullname, email, location, reason } = req.body;

  if (!fullname || !email || !location || !reason) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    let user = await User.findOne({ email });

    const otp = 123456;
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      const referralCode = generateReferralCode(fullname);
      user = new User({
        fullname,
        email,
        location,
        reason,
        isEmailVerified: false,
        otp,
        referralCode,
        otpExpiresAt,
        role: "user",
      });
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      user.fullname = fullname;
      user.location = location;
      user.reason = reason;
    }

    await user.save();

    // Send OTP via email
    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}`);

    res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your email.",
      data: {
        fullname: user.fullname,
        email: user.email,
        location: user.location,
        otp: user.otp, // Remove in production
        otpExpiresAt: user.otpExpiresAt,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.doctorSignup = async (req, res) => {
  try {
    // Destructure and trim fields
    let { fullname, email, mobile, password, gender } = req.body;

    // Trim input
    fullname = fullname ? fullname.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    mobile = mobile ? mobile.trim() : "";
    gender = gender ? gender.trim().toLowerCase() : "";

    // Validation
    if (!fullname || !email || !mobile || !password || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    // Email regex (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Mobile number regex (10-15 digits, you can adjust for your requirements)
    const mobileRegex = /^\d{10,15}$/;
    if (!mobileRegex.test(mobile)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number" });
    }

    // Gender enum check
    const allowedGenders = ["male", "female", "other"];
    if (!allowedGenders.includes(gender)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gender value" });
    }

    // Check if user exists by email or mobile
    let existingUser = await User.findOne({
      $or: [{ email: email }, { mobile: mobile }],
    });
    if (existingUser) {
      // Do not leak which field is duplicate
      return res.status(400).json({
        success: false,
        message: "Account with these details already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      fullname,
      email,
      mobile,
      password: hashedPassword,
      role: "doctor",
      gender,
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
      },
    });
  } catch (err) {
    // Handle duplicate key error from MongoDB
    if (err.code === 11000) {
      // err.keyValue will contain the duplicate field
      return res.status(400).json({
        success: false,
        message: "Account with these details already exists",
      });
    }
    console.error("doctorSignup error:", err);
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

    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY");
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
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.gameForm = async (req, res) => {
  const {
    fullname,
    email,
    mobile,
    location,
    role = "user",
    reason,
    gender,
    countryCode,
  } = req.body;

  console.log("Form Data Received:", {
    fullname,
    email,
    mobile,
    location,
    role,
    reason,
    gender,
    countryCode,
  });

  // Validate required fields
  if (!fullname || !email || !mobile || !location) {
    return res.status(400).json({
      success: false,
      message: "fullname, email, mobile, location, and role are required",
    });
  }

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        fullname,
        email,
        mobile,
        location,
        role,
        reason,
        gender,
        countryCode,
        isMobileVerified: false,
      });
    } else {
      // Optionally update user info
      user.fullname = fullname;
      user.mobile = mobile;
      user.location = location;
      user.role = role;
      user.reason = reason;
      user.gender = gender;
      user.countryCode = countryCode;
    }

    await user.save();

    // Generate a JWT token using email as payload
    const token = jwt.sign({ id: user._id, role: user.role }, "SECRET_KEY");

    res.status(201).json({
      success: true,
      message: "Registration successful. Token generated.",
      data: {
        fullname: user.fullname,
        email: user.email,
        mobile: user.mobile,
        location: user.location,
        role: user.role,
        reason: user.reason,
        gender: user.gender,
        countryCode: user.countryCode,
        isEmailVerified: user.isEmailVerified,
        token: token,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
