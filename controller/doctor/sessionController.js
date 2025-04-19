const User = require("../../models/userModel");
const SessionRequest = require("../../models/SessionRequest");
const sendMessage = require("../../utils/sendMessage");

exports.getDoctorSessionRequests = async (req, res) => {
    const doctorId = req.user?.id;
  
    try {
      const sessions = await SessionRequest.find({ doctor: doctorId })
        .populate("user", "fullname email mobile") // Show user info
        .sort({ createdAt: -1 });
  
      res.status(200).json({
        success: true,
        message: "Doctor's session requests fetched",
        data: sessions,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };


  exports.acceptSessionRequest = async (req, res) => {
    const doctorId = req.user?.id;
    const { sessionId, meetingLink, startTime, endTime } = req.body;
  
    if (!sessionId || !meetingLink || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
  
    try {
      const session = await SessionRequest.findById(sessionId);
      if (!session) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }
  
      if (session.doctor.toString() !== doctorId) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
  
      // Update session
      session.meetingLink = meetingLink;
      session.startTime = new Date(startTime);
      session.endTime = new Date(endTime);
      session.doctorAccept = true;
      await session.save();
  
      // Get user details for notification
      const user = await User.findById(session.user);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      const fullPhone = `${user.countryCode}${user.mobile}`;
      const message = `Hi ${user.fullname}, your session has been accepted.\nMeeting Link: ${meetingLink}\nTime: ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleString()}`;
  
      // Send message (WhatsApp/SMS + Email)
      await sendMessage(fullPhone, message, user.email);
  
      res.status(200).json({
        success: true,
        message: "Session request accepted and user notified",
        data: session,
      });
    } catch (err) {
      console.error("Accept Session Error:", err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  };
  
