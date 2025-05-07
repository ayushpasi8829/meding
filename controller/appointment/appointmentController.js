const TimeSlot = require("../../models/TimeSlot");
const Appointment = require("../../models/Appointment");
const User = require("../../models/userModel");
const createTimeSlots = async (req, res) => {
  try {
    const { date, slots } = req.body;
    const doctor = req.user.id;

    if (!doctor || !date || !Array.isArray(slots) || slots.length === 0) {
      return res
        .status(400)
        .json({ message: "Doctor, date, and slots are required." });
    }

    // Convert date to start of day for comparison
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    // Fetch existing slots for doctor on that date
    const existingSlots = await TimeSlot.find({
      doctor,
      date: {
        $gte: slotDate,
        $lt: new Date(slotDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // Helper to check overlap
    function isOverlapping(newSlot, existingSlot) {
      return (
        newSlot.startTime < existingSlot.endTime &&
        newSlot.endTime > existingSlot.startTime
      );
    }

    const results = [];
    for (const slot of slots) {
      // Validation: startTime < endTime
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
        results.push({
          slot,
          status: "invalid",
          reason: "Invalid start or end time.",
        });
        continue;
      }
      // Validation: must be within the same date
      if (
        startTime.toDateString() !== slotDate.toDateString() ||
        endTime.toDateString() !== slotDate.toDateString()
      ) {
        results.push({
          slot,
          status: "invalid",
          reason: "Slot must be within provided date.",
        });
        continue;
      }
      // Overlap check
      const overlap = existingSlots.some((existing) =>
        isOverlapping({ startTime, endTime }, existing)
      );
      if (overlap) {
        results.push({
          slot,
          status: "skipped",
          reason: "Overlaps with existing slot.",
        });
        continue;
      }
      // Try to create the slot
      try {
        const newSlot = await TimeSlot.create({
          doctor,
          date: slotDate,
          startTime,
          endTime,
        });
        existingSlots.push(newSlot); // Add to in-memory list for further overlap checks
        results.push({ slot, status: "created" });
      } catch (err) {
        // Handle possible unique constraint violation
        results.push({ slot, status: "error", reason: err.message });
      }
    }
    res.status(201).json({ message: "Slots processed.", results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const getDummyTimeSlots = async (req, res) => {
  try {
    const { date } = req.query; // Expect ?date=YYYY-MM-DD
    if (!date) {
      return res
        .status(400)
        .json({ message: "Date is required in query params (YYYY-MM-DD)." });
    }

    // Parse and validate date
    const baseDate = new Date(date);
    if (isNaN(baseDate)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const startHour = 9;
    const endHour = 21; // 9 PM (ending time)

    const slotDuration = 60; // one hour in minutes
    const slots = [];

    for (let hour = startHour; hour < endHour; hour++) {
      let slotStart = new Date(baseDate);
      slotStart.setHours(hour, 0, 0, 0);

      let slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Only include slots that end by or before 9 PM
      if (
        slotEnd.getHours() > endHour ||
        (slotEnd.getHours() === endHour && slotEnd.getMinutes() > 0)
      ) {
        continue;
      }

      slots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    res.status(200).json({
      date,
      slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

// const getAvailableUniqueSlots = async (req, res) => {
//   try {
//     const { date } = req.query;
//     if (!date) {
//       return res
//         .status(400)
//         .json({ message: "Date is required in query params (YYYY-MM-DD)." });
//     }

//     // Parse the date for midnight to midnight
//     const [year, month, day] = date.split("-").map(Number);
//     if (!year || !month || !day) {
//       return res.status(400).json({ message: "Invalid date format." });
//     }
//     const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
//     const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

//     // Find all available slots for that date (status 'available', not booked)
//     const slots = await TimeSlot.find({
//       date: { $gte: dayStart, $lt: nextDay },
//       status: "available",
//       isBooked: false,
//     }).populate("doctor", "name email"); // you can adjust fields as needed

//     // Organize slots by unique interval
//     const slotsMap = {};
//     for (const slot of slots) {
//       const key = `${slot.startTime.toISOString()}_${slot.endTime.toISOString()}`;
//       if (!slotsMap[key]) {
//         slotsMap[key] = {
//           startTime: slot.startTime,
//           endTime: slot.endTime,
//           doctors: [],
//         };
//       }
//       slotsMap[key].doctors.push({
//         _id: slot.doctor._id,
//         name: slot.doctor.name,
//         email: slot.doctor.email,
//         timeSlotId: slot._id, // Needed for booking
//       });
//     }

//     // Format response
//     const response = Object.values(slotsMap).sort(
//       (a, b) => new Date(a.startTime) - new Date(b.startTime)
//     );

//     res.status(200).json({ date, slots: response });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error." });
//   }
// };

const getAvailableUniqueSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ message: "Date is required in query params (YYYY-MM-DD)." });
    }

    const [year, month, day] = date.split("-").map(Number);
    if (!year || !month || !day) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

    const slots = await TimeSlot.find({
      date: { $gte: dayStart, $lt: nextDay },
      status: "available",
      isBooked: false,
    }).populate("doctor", "name email");

    const formattedSlots = slots
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((slot) => ({
        timeSlotId: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        doctors: [
          {
            _id: slot.doctor._id,
            name: slot.doctor.name,
            email: slot.doctor.email,
          },
        ],
      }));

    res.status(200).json({ date, slots: formattedSlots });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { timeSlot, doctor, notes } = req.body;
    const patient = req.user.id;
    // Validate input
    if (!timeSlot || !doctor || !patient) {
      return res
        .status(400)
        .json({ message: "Time slot, doctor, and patient are required." });
    }

    // Check if the time slot exists and is available
    const slot = await TimeSlot.findById(timeSlot);
    if (!slot) {
      return res.status(404).json({ message: "Time slot not found." });
    }
    if (slot.isBooked) {
      return res.status(400).json({ message: "Time slot is already booked." });
    }

    // Check if the doctor and patient exist
    const doctorExists = await User.findById(doctor);
    const patientExists = await User.findById(patient);
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor not found." });
    }
    if (!patientExists) {
      return res.status(404).json({ message: "Patient not found." });
    }

    // Create the appointment
    const appointment = new Appointment({
      timeSlot,
      doctor,
      patient,
      meetLink: doctorExists.meetLink || null, // Assuming doctor's meet link is stored in their profile
      notes: notes || null,
      status: "scheduled", // Default status
      followUpRequired: false, // Default value; can be modified later by the doctor
    });

    // Save the appointment
    await appointment.save();

    // Update the time slot to mark it as booked
    slot.isBooked = true; // Mark the slot as booked
    slot.status = "booked"; // Update status if necessary
    await slot.save();

    res
      .status(201)
      .json({ message: "Appointment booked successfully.", appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
module.exports = {
  createTimeSlots,
  getDummyTimeSlots,
  getAvailableUniqueSlots,
  bookAppointment,
};
