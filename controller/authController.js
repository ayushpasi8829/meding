const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.sendOtp = async (req, res) => {
  const { mobile, countryCode } = req.body;

  if (!mobile || !countryCode) {
    return res.status(400).json({
      success: false,
      message: "Mobile and country code are required",
    });
  }

  // const otp = Math.floor(100000 + Math.random() * 900000).toString(); // generate random OTP
  const otp = 123456;
  const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  try {
    let user = await User.findOne({ mobile });

    if (!user) {
      user = new User({
        mobile,
        countryCode,
        role: "user",
        otp,
        otpExpiresAt,
      });
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
    }

    await user.save();

    // Send OTP via SMS here (e.g., using Twilio or any other service)
    // await sendOtpToMobile(countryCode + mobile, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        mobile: user.mobile,
        otp, // Only for testing – remove in production!
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
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
        mobile: user.mobile,
        token,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (err) {
    console.log("Error verifying OTP:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  const { fullname, email, mobile, location, reason } = req.body;

  if (!fullname || !email || !mobile || !location || !reason) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    let user = await User.findOne({ mobile });

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = 123456;
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      user = new User({
        fullname,
        email,
        mobile,

        location,
        reason,
        isMobileVerified: false,
        otp,
        otpExpiresAt,
        role: "user",
      });
    } else {
      // Update OTP for existing but unverified users
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      // Optionally update other fields if you want to allow edits before verification
      user.fullname = fullname;
      user.email = email;
      user.location = location;
      user.reason = reason;
    }

    await user.save();

    // Send OTP via SMS here

    res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your mobile.",
      data: {
        fullname: user.fullname,
        email: user.email,
        mobile: user.mobile,
        location: user.location,
        otp: user.otp, // ⚠️ Remove or mask this in production!
        otpExpiresAt: user.otpExpiresAt,
        isMobileVerified: user.isMobileVerified,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.doctorSignup = async (req, res) => {
  console.log("droctor signup called", req.body);
  const {
    fullname,
    email,
    mobile,

    password,
    gender,

    therapyCategory,
  } = req.body;

  if (
    !fullname ||
    !email ||
    !mobile ||
    !password ||
    !gender ||
    !therapyCategory
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
  const { fullname, email, mobile, location } = req.body;
  console.log("Form Data Received:", {
    fullname,
    email,
    mobile,
    location,
  });

  if (!fullname || !email || !mobile || !location) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    let user = await User.findOne({ mobile });

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp = 123456;
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    if (!user) {
      user = new User({
        fullname,
        email,
        mobile,
        location,
        isMobileVerified: false,
        otp,
        otpExpiresAt,
        role: "user",
      });
    } else {
      // Update OTP for existing but unverified users
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      // Optionally update other fields if you want to allow edits before verification
      user.fullname = fullname;
      user.email = email;
      user.location = location;
    }

    await user.save();

    // Send OTP via SMS here

    res.status(201).json({
      success: true,
      message: "Registration successful. OTP sent to your mobile.",
      data: {
        fullname: user.fullname,
        email: user.email,
        mobile: user.mobile,
        location: user.location,

        otpExpiresAt: user.otpExpiresAt,
        isMobileVerified: user.isMobileVerified,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
