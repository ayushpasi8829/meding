const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  countryCode: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["doctor", "admin", "user"], required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  dob: { type: Date, required: true },
  therapyCategory: { type: String, default: null },
  availability: {
    startTime: { type: String, default: null }, 
    endTime: { type: String, default: null }
  },
  firstTherapyStatus: { type: String, enum: ["pending", "done"], default: null },
  selectedPlan: { type: String, default: null },

});

module.exports = mongoose.model("User", userSchema);
