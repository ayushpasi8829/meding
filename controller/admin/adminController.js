const User = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMessage = require("../../utils/sendMessage");
const Appointment = require("../../models/Appointment");
const moment = require("moment");

//doctor------
exports.createDoctor = async (req, res) => {
  const {
    fullname,
    email,
    mobile,
    countryCode,
    password,
    gender,
    dob,
    therapyCategory,
    availability, // { startTime: "09:00", endTime: "17:00" }
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
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    let doctor = await User.findOne({ email, role: "doctor" });
    if (doctor) {
      return res.status(400).json({ success: false, message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    doctor = new User({
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

    await doctor.save();

    res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      data: doctor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" });

    res.status(200).json({
      success: true,
      message: "Doctor list fetched successfully",
      data: doctors,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    fullname,
    email,
    mobile,
    countryCode,
    gender,
    dob,
    therapyCategory,
    availability, // Optional: { startTime, endTime }
  } = req.body;

  try {
    const doctor = await User.findById(id);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    doctor.fullname = fullname || doctor.fullname;
    doctor.email = email || doctor.email;
    doctor.mobile = mobile || doctor.mobile;
    doctor.countryCode = countryCode || doctor.countryCode;
    doctor.gender = gender || doctor.gender;
    doctor.dob = dob || doctor.dob;
    doctor.therapyCategory = therapyCategory || doctor.therapyCategory;
    doctor.availability = availability || doctor.availability;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      data: doctor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await User.findById(id);

    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


//users------
exports.userList = async (req, res) => {
    try {
      let users = await User.find({ role: "user" }); 
  
      res.status(200).json({ 
        success: true,
        message: "User List Fetched Successfully",
        data: users,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
};

exports.createUser = async (req, res) => {
  const { fullname, email, mobile, location, reason } = req.body;

  if (!fullname || !email || !mobile || !location || !reason) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const referralCode = generateReferralCode(fullname);

    const user = new User({
      fullname,
      email,
      mobile,
      location,
      reason,
      referralCode,
      isMobileVerified: true,
      role: "user",
    });

    await user.save();

    res.status(201).json({ success: true, message: "User created successfully", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullname, email, mobile, location, reason } = req.body;

  if (!fullname || !email || !mobile || !location || !reason) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.fullname = fullname;
    user.email = email;
    user.mobile = mobile;
    user.location = location;
    user.reason = reason;

    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.SessionStats = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const totalSessions = await Appointment.countDocuments({ doctor: doctorId });
    const completedSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'completed' });
    const cancelledSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'cancelled' });
    const scheduledSessions = await Appointment.countDocuments({ doctor: doctorId, status: 'scheduled' });

    const todaySessions = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'cancelled' } 
    });

    res.status(200).json({
      success: true,
      message: "Doctor session statistics fetched successfully",
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        scheduledSessions,
        todaySessions,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor session stats:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.sendWhatsAppMessage = async (req, res) => {
    const { phone, message, email } = req.body;  
    const response = await sendMessage(phone, message, email);
    res.status(response.success ? 200 : 500).json(response);
  };