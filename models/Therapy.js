const mongoose = require("mongoose");

const therapySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "Individual Therapy",
      "Couple Therapy",
      "Family Therapy",
      "Child Therapy",
      "Group Therapy",
      "Not Sure",
    ],
    default: null,
  },
  concern: { type: String, default: null },
  mode: {
    type: String,
    enum: ["Online", "Offline", "Hybrid"],
    default: null,
  },
  age: { type: Number, default: null },
  language: {
    type: String,
    enum: ["Hindi", "English", "Both"],
    default: null,
  },
  timeline: {
    type: String,
    enum: ["Immediately", "Within a week", "This month", "Just exploring"],
    default: null,
  },
  step3: {
    whatBringsYouToTherapy: { type: String, default: null },
    individualConcerns: [{ type: String }],
    areBothPartnersWilling: {
      type: String,
      enum: ["Yes", "No", null],
      default: null,
    },
    coupleConcerns: [{ type: String }],
    sessionParticipants: { type: String, default: null },
    familyConcerns: [{ type: String }],
    childBehaviors: { type: String, default: null },
    childAttendingSchool: {
      type: String,
      enum: ["Yes", "No", null],
      default: null,
    },
    childEducationLevel: {
      type: String,
      enum: [
        "Preschool",
        "Kindergarten",
        "Primary",
        "Middle",
        "High School",
        "Not attending",
        null,
      ],
      default: null,
    },
  },
  status: {
    type: String,
    enum: ["pending", "done"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Therapy", therapySchema);
