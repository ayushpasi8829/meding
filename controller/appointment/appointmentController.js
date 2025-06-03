const DoctorTimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const User = require("../../models/userModel");
const sendMessage = require("../../utils/sendMessage");
const AppointmentFeedback = require("../../models/AppointmentFeedback");

const addOrUpdateTimeSlots = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { slots } = req.body;
    console.log(req.user);
    // 1. Validate input (each slot must have valid startTime and endTime)
    if (!Array.isArray(slots) || slots.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one slot is required." });
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

    // 2. Upsert: If slots already exist for doctor, update; else, create new
    const updated = await DoctorTimeSlot.findOneAndUpdate(
      { doctor: doctorId },
      { $set: { slots } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Time slots saved successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Error saving time slots:", error);
    return res.status(500).json({
      message: "An error occurred while saving time slots.",
      error: error.message,
    });
  }
};

function generateThirtyMinSlotsWithBreaks(start = "08:00", end = "20:00") {
  const slots = [];
  let [h, m] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  function timeToStr(h, m) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  while (h < endH || (h === endH && m <= endM)) {
    const slotStart = timeToStr(h, m);

    // Calculate slot end
    let slotEndH = h,
      slotEndM = m + 30;
    if (slotEndM >= 60) {
      slotEndH += 1;
      slotEndM -= 60;
    }
    const slotEnd = timeToStr(slotEndH, slotEndM);

    // If the slot ends after the working hours, stop
    if (slotEndH > endH || (slotEndH === endH && slotEndM > endM)) {
      break;
    }

    slots.push({ startTime: slotStart, endTime: slotEnd });

    // Add 30-minute break
    let breakH = slotEndH,
      breakM = slotEndM + 30;
    if (breakM >= 60) {
      breakH += 1;
      breakM -= 60;
    }
    h = breakH;
    m = breakM;
  }
  return slots;
}

// Controller to get all possible 30-min slots with breaks
const getThirtyMinSlotsWithBreaks = (req, res) => {
  const { dayStart = "08:00", dayEnd = "20:00" } = req.query;
  const slots = generateThirtyMinSlotsWithBreaks(dayStart, dayEnd);

  res.status(200).json({
    message: "Available 30-minute slots with 30-minute breaks",
    slots,
  });
};

const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    // Enhanced input validation
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        message: "Valid date is required in 'YYYY-MM-DD' format.",
      });
    }

    // Parse date once to validate it's a real date
    const queryDate = new Date(date);
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Run both database queries concurrently with Promise.all
    // Use select() to fetch only needed fields and lean() for plain JS objects
    const [doctorSlotsDocs, appointments] = await Promise.all([
      DoctorTimeSlot.find({})
        .select("doctor slots")
        .populate("doctor", "fullname email")
        .lean(),

      Appointment.find({
        date: queryDate,
        status: { $in: ["scheduled", "completed"] },
      })
        .select("doctor timeSlot")
        .lean(),
    ]);

    // Create a Map of booked slots for O(1) lookup
    const bookedSlotMap = new Map();
    appointments.forEach((app) => {
      const key = `${app.doctor.toString()}_${app.timeSlot.startTime}-${
        app.timeSlot.endTime
      }`;
      bookedSlotMap.set(key, true);
    });

    // Process all slots and filter available doctors in a single pass
    const slotMap = new Map();

    doctorSlotsDocs.forEach((doc) => {
      if (!doc.doctor) return; // Skip if doctor reference is missing

      doc.slots.forEach((slot) => {
        const slotKey = `${slot.startTime}-${slot.endTime}`;
        const bookingKey = `${doc.doctor._id.toString()}_${slotKey}`;

        // Skip already booked slots immediately (early exit)
        if (bookedSlotMap.has(bookingKey)) return;

        // Add doctor to available doctors for this slot
        if (!slotMap.has(slotKey)) {
          slotMap.set(slotKey, {
            startTime: slot.startTime,
            endTime: slot.endTime,
            doctors: [],
          });
        }

        slotMap.get(slotKey).doctors.push({
          doctorId: doc.doctor._id,
          name: doc.doctor.fullname,
          email: doc.doctor.email,
        });
      });
    });

    // Convert Map to array for response
    const availableSlots = Array.from(slotMap.values());

    return res.status(200).json({
      date,
      availableSlots,
      count: availableSlots.length,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return res.status(500).json({
      message: "An error occurred while fetching available slots.",
      error:
        process.env.NODE_ENV === "production" ? "Server error" : error.message,
    });
  }
};

function isValidTimeSlot(slot) {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return (
    slot &&
    typeof slot.startTime === "string" &&
    typeof slot.endTime === "string" &&
    timeRegex.test(slot.startTime) &&
    timeRegex.test(slot.endTime)
  );
}

const FOUNDER_DOCTOR_ID = "681addd510e15243aa97f475";

const autoBookAppointment = async (req, res) => {
  try {
    const { date, startTime, endTime, bundleId, founder, continueWithSameDoctor  } = req.body;
    const patientId = req.user.id;

    // Validate time input
    if (
      !date ||
      !startTime ||
      !endTime ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime) ||
      !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)
    ) {
      return res.status(400).json({
        message:
          "Please provide date (YYYY-MM-DD), startTime and endTime in HH:mm format.",
      });
    }

    // Parse date in UTC format
    let dateObj;
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");
      dateObj = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    } else {
      dateObj = new Date(date);
    }

    let selectedDoctor;
    let isFounderSelected = founder === true;

    if (isFounderSelected) {
      // Check founder doctor availability
      const founderSlot = await DoctorTimeSlot.findOne({
        doctor: FOUNDER_DOCTOR_ID,
        slots: { $elemMatch: { startTime, endTime } },
      }).populate("doctor", "fullname email");

      if (!founderSlot) {
        return res.status(404).json({ message: "Founder is not available at the selected time." });
      }

      const alreadyBooked = await Appointment.findOne({
        date: dateObj,
        "timeSlot.startTime": startTime,
        "timeSlot.endTime": endTime,
        doctor: FOUNDER_DOCTOR_ID,
        bundleId,
        status: { $in: ["scheduled", "completed"] },
      });

      if (alreadyBooked) {
        return res.status(409).json({ message: "Founder is already booked at the selected time." });
      }

      selectedDoctor = founderSlot;
    } else {
      if (continueWithSameDoctor === true) {
        // Get last doctor for this user
        const lastAppointment = await Appointment.findOne({
          patient: patientId,
          doctor: { $ne: null },
        })
          .sort({ date: -1 })
          .populate("doctor", "fullname email");

        if (!lastAppointment) {
          return res.status(404).json({ message: "No previous doctor found for this user." });
        }

        const doctorId = lastAppointment.doctor._id;

        // Check if that doctor is available for selected slot
        const slot = await DoctorTimeSlot.findOne({
          doctor: doctorId,
          slots: { $elemMatch: { startTime, endTime } },
        }).populate("doctor", "fullname email");

        if (!slot) {
          return res.status(404).json({ message: "Previous doctor not available at selected time." });
        }

        const alreadyBooked = await Appointment.findOne({
          date: dateObj,
          "timeSlot.startTime": startTime,
          "timeSlot.endTime": endTime,
          doctor: doctorId,
          bundleId,
          status: { $in: ["scheduled", "completed"] },
        });

        if (alreadyBooked) {
          return res.status(409).json({ message: "Previous doctor is already booked at the selected time." });
        }

        selectedDoctor = slot;
      } else {
      // Normal auto-book logic
      const [doctorsWithSlot, bookedAppointments] = await Promise.all([
        DoctorTimeSlot.find({
          slots: { $elemMatch: { startTime, endTime } },
        }).populate("doctor", "fullname email").lean(),
        Appointment.find({
          date: dateObj,
          "timeSlot.startTime": startTime,
          "timeSlot.endTime": endTime,
          bundleId,
          status: { $in: ["scheduled", "completed"] },
        }).lean()
      ]);

      if (!doctorsWithSlot.length) {
        return res.status(404).json({ message: "No doctors available for the given time slot." });
      }

      const bookedDoctorIds = new Set(bookedAppointments.map(a => String(a.doctor)));
      const availableDoctors = doctorsWithSlot.filter(
        docSlot => !bookedDoctorIds.has(String(docSlot.doctor._id))
      );

      if (!availableDoctors.length) {
        return res.status(409).json({ message: "All doctors are booked for this time slot." });
      }

      selectedDoctor = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];
    }
  }
    // Create appointment
    const appointment = await Appointment.create({
      date: dateObj,
      timeSlot: { startTime, endTime },
      doctor: selectedDoctor.doctor._id,
      patient: patientId,
      status: "scheduled",
      founder: isFounderSelected, // Save founder flag
    });

    const patient = await User.findById(patientId);
    const fullPhone = `+${String(patient.countryCode).replace(/\D/g, "")}${String(patient.mobile).replace(/\D/g, "")}`;
    const notificationMessage = `Hello ${patient.fullname}, your session with Dr. ${selectedDoctor.doctor.fullname} on ${date} from ${startTime} to ${endTime} has been scheduled successfully.`;

    sendMessage(fullPhone, notificationMessage, patient.email, patient._id).catch((err) =>
      console.error("Failed to send message:", err)
    );

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: {
        id: appointment._id,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        founder: appointment.founder,
        doctor: {
          id: selectedDoctor.doctor._id,
          name: selectedDoctor.doctor.fullname,
          email: selectedDoctor.doctor.email,
        },
      },
    });
  } catch (error) {
    console.error("Error auto booking appointment:", error);
    return res.status(500).json({
      message: "An error occurred while booking the appointment.",
      error: error.message,
    });
  }
};


const submitFeedback = async (req, res) => {
  const patientId = req.user.id;
  const { sessionId } = req.params;
  const { rating, review } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating (1-5) is required." });
  }

  try {
    const appointment = await Appointment.findById(sessionId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.patient.toString() !== patientId) {
      return res.status(403).json({ success: false, message: "Unauthorized feedback attempt" });
    }

    const existing = await AppointmentFeedback.findOne({ appointment: sessionId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Feedback already submitted" });
    }

    const feedback = await AppointmentFeedback.create({
      appointment: sessionId,
      patient: patientId,
      doctor: appointment.doctor,
      rating,
      review,
    });

    return res.status(201).json({ success: true, message: "Feedback submitted", data: feedback });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  addOrUpdateTimeSlots,
  getThirtyMinSlotsWithBreaks,
  getAvailableSlots,
  autoBookAppointment,
  submitFeedback
};
