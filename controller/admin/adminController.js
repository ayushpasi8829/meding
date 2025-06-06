const User = require("../../models/userModel");
const BundleType = require("../../models/BundleType");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMessage = require("../../utils/sendMessage");
const UserAnswer = require("../../models/gameAnswerModel");
const Appointment = require("../../models/Appointment");
const moment = require("moment");
const ExcelJS = require("exceljs");
const Notification = require("../../models/Notification");
const SlotTemplate = require("../../models/SlotTemplate");
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
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    let doctor = await User.findOne({ email, role: "doctor" });
    if (doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor already exists" });
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

    if (req.query.export === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Doctors");

      worksheet.columns = [
        { header: "Full Name", key: "fullname", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Mobile", key: "mobile", width: 20 },
        { header: "Speciality", key: "speciality", width: 25 },
        { header: "Created At", key: "createdAt", width: 25 },
      ];

      doctors.forEach((doctor) => {
        worksheet.addRow({
          fullname: doctor.fullname,
          email: doctor.email,
          mobile: doctor.mobile,
          speciality: doctor.speciality || "",
          createdAt: doctor.createdAt?.toISOString(),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=doctors_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(200).json({
      success: true,
      message: "Doctor list fetched successfully",
      data: doctors,
    });
  } catch (err) {
    console.error("Doctor List Error:", err);
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
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
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
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Doctor deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//users------
exports.userList = async (req, res) => {
  try {
    const users = await User.find({ role: "user" });

    // If `export=excel` is passed, generate and send Excel
    if (req.query.export === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Users");

      worksheet.columns = [
        { header: "Full Name", key: "fullname", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Mobile", key: "mobile", width: 20 },
        { header: "Created At", key: "createdAt", width: 25 },
      ];

      users.forEach((user) => {
        worksheet.addRow({
          fullname: user.fullname,
          email: user.email,
          mobile: user.mobile,
          createdAt: user.createdAt?.toISOString(),
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=users_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    // Normal JSON response
    res.status(200).json({
      success: true,
      message: "User List Fetched Successfully",
      data: users,
    });
  } catch (err) {
    console.error("User List Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.createUser = async (req, res) => {
  const { fullname, email, mobile, location, reason } = req.body;

  if (!fullname || !email || !mobile || !location || !reason) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exists" });
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

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullname, email, mobile, location, reason } = req.body;

  if (!fullname || !email || !mobile || !location || !reason) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.fullname = fullname;
    user.email = email;
    user.mobile = mobile;
    user.location = location;
    user.reason = reason;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.SessionStats = async (req, res) => {
  const doctorId = req.user?.id;

  try {
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const totalSessions = await Appointment.countDocuments({
      doctor: doctorId,
    });
    const completedSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "completed",
    });
    const cancelledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "cancelled",
    });
    const scheduledSessions = await Appointment.countDocuments({
      doctor: doctorId,
      status: "scheduled",
    });

    const todaySessions = await Appointment.countDocuments({
      doctor: doctorId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: "cancelled" },
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

exports.getAllAppointments = async (req, res) => {
  try {
    const { filter, date, export: exportType } = req.query;
    let query = {};

    if (filter === "today") {
      const today = moment().startOf("day");
      const tomorrow = moment(today).add(1, "day");
      query.date = { $gte: today.toDate(), $lt: tomorrow.toDate() };
    } else if (date) {
      const selectedDate = moment(date, "YYYY-MM-DD");
      const nextDay = moment(selectedDate).add(1, "day");
      query.date = { $gte: selectedDate.toDate(), $lt: nextDay.toDate() };
    }

    const appointments = await Appointment.find(query)
      .populate("doctor", "fullname email")
      .populate("patient", "fullname email mobile")
      .sort({ date: -1 });

    // 🔄 Excel export logic
    if (exportType === "excel") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Appointments");

      // Define columns
      worksheet.columns = [
        { header: "Doctor Name", key: "doctorName", width: 25 },
        { header: "Doctor Email", key: "doctorEmail", width: 25 },
        { header: "Patient Name", key: "patientName", width: 25 },
        { header: "Patient Email", key: "patientEmail", width: 25 },
        { header: "Patient Mobile", key: "patientMobile", width: 20 },
        { header: "Date", key: "date", width: 15 },
        { header: "Start Time", key: "startTime", width: 15 },
        { header: "End Time", key: "endTime", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Add rows
      appointments.forEach((appointment) => {
        worksheet.addRow({
          doctorName: appointment.doctor?.fullname || "",
          doctorEmail: appointment.doctor?.email || "",
          patientName: appointment.patient?.fullname || "",
          patientEmail: appointment.patient?.email || "",
          patientMobile: appointment.patient?.mobile || "",
          date: moment(appointment.date).format("YYYY-MM-DD"),
          startTime: appointment.timeSlot?.startTime || "",
          endTime: appointment.timeSlot?.endTime || "",
          status: appointment.status || "",
        });
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=appointments_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
      return res.end();
    }

    // Normal JSON response
    res.status(200).json({
      success: true,
      message: "Appointments fetched successfully",
      data: appointments,
    });
  } catch (err) {
    console.error("Admin fetch appointments error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, user, status, type, exportExcel } = req.query;
    const filter = {};

    if (user) filter.user = user;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate("user", "name email")
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    // Excel Export
    if (exportExcel === "true") {
      const dataForExcel = notifications.map((n) => ({
        User: n.user?.name || "",
        Email: n.user?.email || "",
        Recipient: n.recipient,
        Message: n.message,
        Type: n.type,
        Status: n.status,
        SentAt: n.sentAt ? new Date(n.sentAt).toLocaleString() : "",
        Error: n.error || "",
      }));

      const ws = XLSX.utils.json_to_sheet(dataForExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Notifications");

      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      res.setHeader(
        "Content-Disposition",
        'attachment; filename="notifications.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      return res.send(buffer);
    }

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      total,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a bundle type
exports.createBundleType = async (req, res) => {
  try {
    const { name, sessionCount, price } = req.body;

    if (!name || !sessionCount || !price) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const bundleType = await BundleType.create({ name, sessionCount, price });

    res.status(201).json({
      success: true,
      message: "Bundle type created successfully",
      data: bundleType,
    });
  } catch (error) {
    console.error("Error creating bundle type:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all bundle types
exports.getAllBundleTypes = async (req, res) => {
  try {
    const bundles = await BundleType.find();
    res.status(200).json({
      success: true,
      message: "Bundle types fetched successfully",
      data: bundles,
    });
  } catch (error) {
    console.error("Error fetching bundle types:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single bundle type by ID
exports.getBundleTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const bundle = await BundleType.findById(id);

    if (!bundle) {
      return res
        .status(404)
        .json({ success: false, message: "Bundle type not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bundle type fetched successfully",
      data: bundle,
    });
  } catch (error) {
    console.error("Error fetching bundle type:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update bundle type
exports.updateBundleType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sessionCount, price } = req.body;

    const updated = await BundleType.findByIdAndUpdate(
      id,
      { name, sessionCount, price },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Bundle type not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bundle type updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating bundle type:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete bundle type
exports.deleteBundleType = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await BundleType.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Bundle type not found" });
    }

    res.status(200).json({
      success: true,
      message: "Bundle type deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bundle type:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleUserRole = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Toggle role
    const newRole = user.role === "admin" ? "user" : "admin";
    user.role = newRole;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.fullname} role changed to ${newRole}`,
      data: user,
    });
  } catch (error) {
    console.error("Error toggling user role:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getUserActivitySummary = async (req, res) => {
  try {
     const users = await User.find({ role: "user" }, "_id fullname email mobile");

    const summary = {
      onlyRegistered: [],
      playedGameOnly: [],
      oneAppointmentOnly: [],
      twoAppointmentsOnly: [],
      moreThanTwoAppointments: [],
    };

    for (const user of users) {
      const [appointmentCount, gameAnswerCount] = await Promise.all([
        Appointment.countDocuments({ patient: user._id }),
        UserAnswer.countDocuments({ user: user._id }),
      ]);

      if (appointmentCount === 0 && gameAnswerCount === 0) {
        summary.onlyRegistered.push(user);
      } else if (appointmentCount === 0 && gameAnswerCount > 0) {
        summary.playedGameOnly.push(user);
      } else if (appointmentCount === 1) {
        summary.oneAppointmentOnly.push(user);
      } else if (appointmentCount === 2) {
        summary.twoAppointmentsOnly.push(user);
      } else if (appointmentCount > 2) {
        summary.moreThanTwoAppointments.push(user);
      }
    }

    res.status(200).json({
      message: "User activity summary fetched successfully",
      data: {
        counts: {
          onlyRegistered: summary.onlyRegistered.length,
          playedGameOnly: summary.playedGameOnly.length,
          oneAppointmentOnly: summary.oneAppointmentOnly.length,
          twoAppointmentsOnly: summary.twoAppointmentsOnly.length,
          moreThanTwoAppointments: summary.moreThanTwoAppointments.length,
        },
        users: summary,
      },
    });
  } catch (error) {
    console.error("Error fetching user activity summary:", error);
    res.status(500).json({
      message: "Failed to fetch user activity summary",
      error: error.message,
    });
  }
};


exports.addSlotTemplate = async (req, res) => {
  try {
    const { slots } = req.body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ message: "At least one slot is required." });
    }

    for (const slot of slots) {
      if (
        !slot.startTime ||
        !slot.endTime ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(slot.startTime) ||
        !/^([01]\d|2[0-3]):([0-5]\d)$/.test(slot.endTime)
      ) {
        return res.status(400).json({
          message:
            "Each slot must have valid startTime and endTime in HH:mm format.",
        });
      }
    }

    const createdSlots = await SlotTemplate.insertMany(
      slots.map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime
      }))
    );

    return res.status(201).json({
      message: "Slot templates created successfully.",
      data: createdSlots,
    });
  } catch (error) {
    console.error("Error adding slot templates:", error);
    return res.status(500).json({
      message: "An error occurred while creating slot templates.",
      error: error.message,
    });
  }
};

exports.getSlotTemplates = async (req, res) => {
  try {
    const templates = await SlotTemplate.find().sort({ startTime: 1 });

    return res.status(200).json({
      message: "Slot templates fetched successfully.",
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching slot templates:", error);
    return res.status(500).json({
      message: "Error retrieving slot templates.",
      error: error.message,
    });
  }
};

exports.sendWhatsAppMessage = async (req, res) => {
  const { phone, message, email } = req.body;
  const response = await sendMessage(phone, message, email);
  res.status(response.success ? 200 : 500).json(response);
};
