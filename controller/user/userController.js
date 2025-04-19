const User = require("../../models/userModel");
const SessionRequest = require("../../models/SessionRequest");

exports.getTherapyCategories = async (req, res) => {
    try {
      const categories = [
        "Cognitive Behavioral Therapy (CBT)",
        "Dialectical Behavior Therapy (DBT)",
        "Psychodynamic Therapy",
        "Humanistic Therapy",
        "Mindfulness-Based Therapy",
        "Art Therapy",
        "Family Therapy",
        "Group Therapy",
        "Play Therapy",
        "Trauma-Focused Therapy"
      ];
  
      res.status(200).json({
        success: true,
        message: "Therapy categories fetched successfully",
        data: categories,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  

exports.selectCategory = async (req, res) => {
    const  userId  = req.user?.id; 
    const { therapyCategory } = req.body;
  
    if (!therapyCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Therapy category is required" });
    }
    console.log(userId);
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { therapyCategory },
        { new: true }
      );
  
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
  
      res.status(200).json({
        success: true,
        message: "Therapy category updated successfully",
        data: {
          id: user._id,
          fullname: user.fullname,
          therapyCategory: user.therapyCategory,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };


  exports.createSessionRequest = async (req, res) => {
    const  userId  = req.user?.id
    const now = new Date();
  
    try {
      // Fetch the user
      const user = await User.findById(userId);
      if (!user || user.role !== "user") {
        return res.status(404).json({ success: false, message: "User not found or not a valid user" });
      }
  
      // Get user's therapy category
      const userCategory = user.therapyCategory;
      if (!userCategory) {
        return res.status(400).json({ success: false, message: "User has not selected a therapy category" });
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
        return res.status(404).json({ success: false, message: "No doctor available at this time" });
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
  