const User = require("../../models/userModel");
const Therapy = require("../../models/Therapy");
const CorporateWellness = require("../../models/CorporateWellness");
const Internship = require("../../models/Internship");
const PsychometricAssessment = require("../../models/PsychometricAssessment");
const SessionRequest = require("../../models/SessionRequest");
const Appointment = require("../../models/Appointment");
const BundleSession = require("../../models/BundleSession");
const moment = require("moment");

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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const therapy = new Therapy({
      user: userId,
      type: therapyType,
      concern: therapyType === "Not Sure" ? consultationConcern : null,
    });

    await therapy.save();

    // Update user record with reference to therapy
    user.therapy = therapy._id;
    await user.save();

    if (therapyType === "Not Sure") {
      const availableSlots = getRelationshipManagerAvailability(); // Your existing function

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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.therapyGeneralQuestions = async (req, res) => {
  const { mode, age, language, timeline } = req.body;
  const userId = req.user.id;

  if (!userId || !mode || !age || !language || !timeline) {
    return res.status(400).json({
      success: false,
      message: "All general therapy fields are required",
    });
  }

  try {
    const user = await User.findById(userId).populate("therapy");
    if (!user || !user.therapy) {
      return res
        .status(404)
        .json({ success: false, message: "Therapy not found for user" });
    }

    const therapy = await Therapy.findById(user.therapy);

    therapy.mode = mode;
    therapy.age = age;
    therapy.language = language;
    therapy.timeline = timeline;

    await therapy.save();

    return res.status(200).json({
      success: true,
      message: "General therapy preferences saved successfully",
      data: { mode, age, language, timeline },
    });
  } catch (error) {
    console.error("Therapy general questions error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
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
    const user = await User.findById(userId).populate("therapy");
    if (!user || !user.therapy) {
      return res
        .status(404)
        .json({ success: false, message: "Therapy not found for user" });
    }

    const therapy = await Therapy.findById(user.therapy);

    therapy.step3 = {
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

    await therapy.save();

    return res.status(200).json({
      success: true,
      message: "Therapy step 3 data updated successfully",
      data: therapy.step3,
    });
  } catch (err) {
    console.error("Step 3 Update Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//---------psychometrics-------------------

exports.savePsychometricStep1 = async (req, res) => {
  const {
    recommendedByProfessional,
    recommendationDetails,
    areasOfConcern,
    symptomsObserved,
    underTreatment,
    ageOfIndividual,
  } = req.body;

  const userId = req.user.id;

  if (
    !userId ||
    !recommendedByProfessional ||
    !underTreatment ||
    !ageOfIndividual
  ) {
    return res.status(400).json({
      success: false,
      message: "Required fields missing",
    });
  }

  try {
    const record = new PsychometricAssessment({
      userId,
      recommendedByProfessional,
      recommendationDetails:
        recommendedByProfessional === "Yes" ? recommendationDetails : null,
      areasOfConcern,
      symptomsObserved,
      underTreatment,
      ageOfIndividual,
    });

    await record.save();

    res.status(200).json({
      success: true,
      message:
        "Thank you for sharing. Based on your inputs, our psychologist will design a plan and reach out within 24 hours.",
    });
  } catch (error) {
    console.error("Psychometric Step 1 Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//----------CorporateWellness -----------

exports.submitCorporateWellness = async (req, res) => {
  const {
    institutionType,
    organizationName,
    designation,
    numberOfMembers,
    interestedServices,
    notSureMessage,
    goals,
    estimatedBudget,
  } = req.body;

  const userId = req.user.id;

  if (
    !institutionType ||
    !organizationName ||
    !designation ||
    !numberOfMembers ||
    !interestedServices ||
    !goals ||
    !estimatedBudget
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const record = await CorporateWellness.create({
      userId,
      institutionType,
      organizationName,
      designation,
      numberOfMembers,
      interestedServices,
      notSureMessage: interestedServices === "Not sure" ? notSureMessage : null,
      goals,
      estimatedBudget,
    });

    return res.status(200).json({
      success: true,
      message: "Corporate wellness information submitted successfully",
      data: record,
    });
  } catch (err) {
    console.error("Corporate Wellness Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//-----------------internship-----------

exports.submitInternshipForm = async (req, res) => {
  const {
    studentOrProfessional,
    collegeName,
    internshipLevel,
    whyChooseYou,
    heardFrom,
    heardFromOther,
  } = req.body;

  const userId = req.user.id;

  if (
    !studentOrProfessional ||
    !collegeName ||
    !internshipLevel ||
    !whyChooseYou ||
    !heardFrom
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const internship = await Internship.create({
      userId,
      studentOrProfessional,
      collegeName,
      internshipLevel,
      whyChooseYou,
      heardFrom,
      heardFromOther: heardFrom === "Other" ? heardFromOther : null,
    });

    return res.status(200).json({
      success: true,
      message: "Internship form submitted successfully",
      data: internship,
    });
  } catch (err) {
    console.error("Internship Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
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

exports.getSessionSummary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    console.log(userId)
    const allAppointments = await Appointment.find({ patient: userId });
    console.log(allAppointments);
    const upcoming = allAppointments.filter(app => app.date > now &&  app.status === "scheduled");
    const completed = allAppointments.filter(app => app.status === "completed");
    const cancelled = allAppointments.filter(app =>
      ["cancelled", "no-show"].includes(app.status)
    );

    return res.json({
      totalSessions: allAppointments.length,
      upcomingSessions: upcoming.length,
      completedSessions: completed.length,
      cancelledOrNoShow: cancelled.length,
    });
  } catch (err) {
    console.error("Error getting session summary:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTodaySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStart = moment().startOf("day").toDate();
    const todayEnd = moment().endOf("day").toDate();

    const todaySession = await Appointment.findOne({
      patient: userId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: "scheduled"
    }).populate("doctor", "name email");

    if (!todaySession) {
      return res.json({ hasSessionToday: false, message: "No session scheduled for today" });
    }

    return res.json({
      hasSessionToday: true,
      session: {
        date: todaySession.date,
        timeSlot: todaySession.timeSlot,
        doctor: todaySession.doctor,
      }
    });
  } catch (err) {
    console.error("Error checking today's session:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getUpcomingSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const upcomingSession = await Appointment.findOne({
      patient: userId,
      date: { $gt: now },
      status: "scheduled"
    })
    .sort({ date: 1 })
    .populate("doctor", "name email");

    if (!upcomingSession) {
      return res.json({ hasUpcomingSession: false, message: "No upcoming sessions" });
    }

    return res.json({
      hasUpcomingSession: true,
      session: {
        date: upcomingSession.date,
        timeSlot: upcomingSession.timeSlot,
        doctor: upcomingSession.doctor,
      }
    });
  } catch (err) {
    console.error("Error checking upcoming session:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTherapyPlan = async (req, res) => {
  try {
    const userId = req.user.id;

    const bundle = await BundleSession.findOne({ user: userId, isActive: true });

    if (!bundle) {
      return res.json({ hasActivePlan: false, message: "No active therapy bundle found." });
    }

    const { bundleType, totalSessions, usedSessions, paymentPlan } = bundle;
    const { totalAmount, paidAmount, installments } = paymentPlan;

    const dueAmount = totalAmount - paidAmount;

    // Find next unpaid installment (if any)
    const nextInstallment = installments.find(inst => inst.status === "pending");

    return res.json({
      hasActivePlan: true,
      bundleId: bundle._id,
      bundleType,
      totalSessions,
      usedSessions,
      remainingSessions: totalSessions - usedSessions,
      totalAmount,
      paidAmount,
      dueAmount,
      installments,
      nextPayment: nextInstallment
        ? {
            amount: nextInstallment.amount,
            dueAfterSession: nextInstallment.dueSessionNumber,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching therapy plan:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.getTherapyNotes = async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await Appointment.find({
      patient: userId,
      notes: { $exists: true, $ne: "" }
     
    })
      .populate("doctor", "fullname") 
      .sort({ date: -1 }); 

    const notes = appointments.map(appointment => ({
      date: appointment.date,
      doctorName: appointment.doctor?.fullname || "Unknown",
      therapyNotes: appointment.notes
    }));

    return res.json({ notes });
  } catch (error) {
    console.error("Error fetching therapy notes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
