const mongoose = require("mongoose");

const psychometricSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recommendedByProfessional: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  recommendationDetails: { type: String, default: null },
  areasOfConcern: [{ type: String }],
  symptomsObserved: { type: String, default: null },
  underTreatment: { type: String, enum: ["Yes", "No"], required: true },
  ageOfIndividual: { type: Number, required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PsychometricAssessment", psychometricSchema);
