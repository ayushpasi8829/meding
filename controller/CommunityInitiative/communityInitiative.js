const Volunteer = require("../../models/volunteer");
const {
  TherapyPlusJoin,
  TherapyPlusHost,
} = require("../../models/TherapyPlus");
const OrgCampRequest = require("../../models/OrgCampRequest");
const createVolunteer = async (req, res) => {
  try {
    const { name, age, city, college, education, why } = req.body;
    const user = req.user?.id;
    const volunteer = new Volunteer({
      user,
      name,
      age,
      city,
      college,
      education,
      why,
    });

    await volunteer.save();

    res.status(201).json({
      success: true,
      message: "Volunteer application received",
      data: volunteer,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createOrgCampRequest = async (req, res) => {
  try {
    const { orgName, city, date, participants, contact } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const campRequest = new OrgCampRequest({
      user,
      orgName,
      city,
      date,
      participants,
      contact,
    });

    await campRequest.save();

    res.status(201).json({
      success: true,
      message: "Camp request submitted successfully",
      data: campRequest,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const createTherapyPlusJoin = async (req, res) => {
  console.log("Request body:", req.body); // Log the request body for debugging
  try {
    const { name, phone, email, city, age, profession } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const whatsappLink = "https://chat.whatsapp.com/YourGroupLinkHere"; // You can make this dynamic

    const joinDoc = new TherapyPlusJoin({
      user,
      name,
      phone,
      email,
      city,
      age,
      profession,
      whatsappLink,
    });

    await joinDoc.save();

    res.status(201).json({
      success: true,
      message: "Joined Therapy Plus group successfully.",
      data: joinDoc,
      whatsappLink,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Controller for proposing a Therapy Plus session
const createTherapyPlusHost = async (req, res) => {
  try {
    const {
      name,
      profession,
      sessionType,
      sessionDetails,
      preferredDate,
      experience,
    } = req.body;
    const user = req.user?.id;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized user" });
    }

    const hostDoc = new TherapyPlusHost({
      user,
      name,
      profession,
      sessionType,
      sessionDetails,
      preferredDate,
      experience,
    });

    await hostDoc.save();

    res.status(201).json({
      success: true,
      message: "Session proposal submitted successfully",
      data: hostDoc,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
module.exports = {
  createVolunteer,
  createOrgCampRequest,
  createTherapyPlusJoin,
  createTherapyPlusHost,
};
