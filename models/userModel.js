const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  countryCode: { type: String, required: true },
  role: { type: String, enum: ["doctor", "admin", "user"], required: true },
  location: { type: String, required: true },
  reason: {
    type: String,
    enum: [
      "Therapy",
      "Psychometric Assessment",
      "Corporate Wellness",
      "Community Initiatives",
      "Internships",
      "Not Sure"
    ],
    required: true
  },
  therapy: {
    type: {
      type: String,
      enum: [
        "Individual Therapy",
        "Couple Therapy",
        "Family Therapy",
        "Child Therapy",
        "Group Therapy",
        "Not Sure"
      ],
      default: null
    },
    concern: { type: String, default: null },
    mode: {
      type: String,
      enum: ["Online", "Offline", "Hybrid"],
      default: null
    },
    age: { type: Number, default: null },
    language: {
      type: String,
      enum: ["Hindi", "English", "Both"],
      default: null
    },
    timeline: {
      type: String,
      enum: ["Immediately", "Within a week", "This month", "Just exploring"],
      default: null
    },
    step3: {
      whatBringsYouToTherapy: { type: String, default: null },
      individualConcerns: [{ type: String }],
      areBothPartnersWilling: { type: String, enum: ["Yes", "No", null], default: null },
      coupleConcerns: [{ type: String }],
      sessionParticipants: { type: String, default: null },
      familyConcerns: [{ type: String }],
      childBehaviors: { type: String, default: null },
      childAttendingSchool: { type: String, enum: ["Yes", "No", null], default: null },
      childEducationLevel: {
        type: String,
        enum: [
          "Preschool",
          "Kindergarten",
          "Primary",
          "Middle",
          "High School",
          "Not attending",
          null
        ],
        default: null
      }
    }
  },  
  availability: {
    startTime: { type: String, default: null }, 
    endTime: { type: String, default: null }
  },
  firstTherapyStatus: { type: String, enum: ["pending", "done"], default: null },
  selectedPlan: { type: String, default: null },
  otp: { type: String, required: false },
  otpExpiresAt: { type: Date, required: false },
  isMobileVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
