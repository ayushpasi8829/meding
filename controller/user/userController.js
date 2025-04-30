const User = require("../../models/userModel");
const SessionRequest = require("../../models/SessionRequest");

const getRelationshipManagerAvailability = () => {
  return [
    "2025-04-26T10:00:00Z",
    "2025-04-26T15:00:00Z",
    "2025-04-27T11:30:00Z",
  ];
};

exports.therapyFlow = async (req, res) => {
  const { therapyType, consultationConcern } = req.body;
  const userId = req.user.id;
  if (!userId || !therapyType) {
    return res.status(400).json({
      success: false,
      message: "User ID and therapy type are required",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.therapy = {
      type: therapyType,
      concern: therapyType === "Not Sure" ? consultationConcern : null,
    };

    await user.save();

    if (therapyType === "Not Sure") {
      const availableSlots = getRelationshipManagerAvailability();

      return res.status(200).json({
        success: true,
        message: "Therapy info saved. Show consultation calendar.",
        data: {
          therapyType,
          concern: consultationConcern,
          availableSlots,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Therapy type saved",
      data: {
        therapyType,
      },
    });
  } catch (error) {
    console.error("Therapy flow error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.therapyGeneralQuestions = async (req, res) => {
  const { mode, age, language, timeline } = req.body;
  const userId = req.user.id;
  // Validate required fields
  if (!userId || !mode || !age || !language || !timeline) {
    return res.status(400).json({
      success: false,
      message: "All general therapy fields are required",
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If therapy object doesn't exist, create it
    if (!user.therapy) user.therapy = {};

    // Update general questions
    user.therapy.mode = mode;
    user.therapy.age = age;
    user.therapy.language = language;
    user.therapy.timeline = timeline;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "General therapy preferences saved successfully",
      data: {
        mode,
        age,
        language,
        timeline,
      },
    });
  } catch (error) {
    console.error("Therapy general questions error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// POST /api/user/therapy/step3

exports.updateStep3TherapyDetails = async (req, res) => {
  const userId = req.user.id;
  const {
    whatBringsYouToTherapy,
    individualConcerns,
    areBothPartnersWilling,
    coupleConcerns,
    sessionParticipants,
    familyConcerns,
    childBehaviors,
    childAttendingSchool,
    childEducationLevel,
  } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Store in therapy.step3
    user.therapy.step3 = {
      whatBringsYouToTherapy: whatBringsYouToTherapy || null,
      individualConcerns: individualConcerns || [],
      areBothPartnersWilling: areBothPartnersWilling || null,
      coupleConcerns: coupleConcerns || [],
      sessionParticipants: sessionParticipants || null,
      familyConcerns: familyConcerns || [],
      childBehaviors: childBehaviors || null,
      childAttendingSchool: childAttendingSchool || null,
      childEducationLevel: childEducationLevel || null,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Therapy step 3 data updated successfully",
      data: user.therapy.step3,
    });
  } catch (err) {
    console.error("Step 3 Update Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createSessionRequest = async (req, res) => {
  const userId = req.user?.id;
  const now = new Date();

  try {
    // Fetch the user
    const user = await User.findById(userId);
    if (!user || user.role !== "user") {
      return res.status(404).json({
        success: false,
        message: "User not found or not a valid user",
      });
    }

    // Get user's therapy category
    const userCategory = user.therapyCategory;
    if (!userCategory) {
      return res.status(400).json({
        success: false,
        message: "User has not selected a therapy category",
      });
    }

    const currentHourMinute = now.toTimeString().slice(0, 5); // "HH:MM"

    // Find a doctor with matching category and time availability
    const doctor = await User.findOne({
      role: "doctor",
      therapyCategory: userCategory,
      "availability.startTime": { $lte: currentHourMinute },
      "availability.endTime": { $gte: currentHourMinute },
    });

    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "No doctor available at this time" });
    }

    // Create session request
    const session = new SessionRequest({
      user: user._id,
      doctor: doctor._id,
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: "Session request created",
      data: {
        sessionId: session._id,
        user: user.fullname,
        doctor: doctor.fullname,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
