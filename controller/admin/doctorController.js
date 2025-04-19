const User = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendMessage = require("../../utils/sendMessage");

exports.doctorList = async (req, res) => {
    try {
      let doctors = await User.find({ role: "doctor" }); 
  
      res.status(200).json({ 
        success: true,
        message: "Doctor List Fetched Successfully",
        data: doctors,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Server Error" });
    }
};
  
exports.sendWhatsAppMessage = async (req, res) => {
    const { phone, message, email } = req.body;  
    const response = await sendMessage(phone, message, email);
    res.status(response.success ? 200 : 500).json(response);
  };