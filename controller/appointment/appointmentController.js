const DoctorTimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const User = require("../../models/userModel");
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

const autoBookAppointment = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const patient = req.user.id; // From auth middleware

    // Validate input
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

    const dateObj = new Date(date);

    // Step 1: Find all doctors who have this slot available
    const doctorsWithSlot = await DoctorTimeSlot.find({
      slots: { $elemMatch: { startTime, endTime } },
    }).populate("doctor", "fullname email");

    if (!doctorsWithSlot.length) {
      return res
        .status(404)
        .json({ message: "No doctors available for the given time slot." });
    }

    // Step 2: Find doctors already booked for this slot on this date
    const bookedAppointments = await Appointment.find({
      date: dateObj,
      "timeSlot.startTime": startTime,
      "timeSlot.endTime": endTime,
      status: { $in: ["scheduled", "completed"] },
    });

    const bookedDoctorIds = bookedAppointments.map((a) => a.doctor.toString());

    // Step 3: Filter out booked doctors
    const availableDoctors = doctorsWithSlot.filter(
      (docSlot) => !bookedDoctorIds.includes(docSlot.doctor._id.toString())
    );

    if (!availableDoctors.length) {
      return res
        .status(409)
        .json({ message: "All doctors are booked for this time slot." });
    }

    // Step 4: Pick a doctor (random or custom logic)
    const selectedDoctor = availableDoctors[Math.floor(Math.random() * availableDoctors.length)];

    // Step 5: Book the appointment
    const appointment = await Appointment.create({
      date: dateObj,
      timeSlot: { startTime, endTime },
      doctor: selectedDoctor.doctor._id,
      patient,
      status: "scheduled",
    });

    return res.status(201).json({
      message: "Appointment booked successfully.",
      appointment: {
        id: appointment._id,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
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

module.exports = {
  addOrUpdateTimeSlots,
  getThirtyMinSlotsWithBreaks,
  getAvailableSlots,
  autoBookAppointment,
};
