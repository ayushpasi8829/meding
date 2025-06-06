const mongoose = require("mongoose");

const communityEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["group therapy", "therapyplus", "Counselers session"],
    required: true,
  },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  peopleJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  timeSlot: {
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
  },
  date: { type: Date, required: true },
  meetingLink: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["upcoming", "completed", "cancelled"], default: "upcoming" },
  image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("CommunityEvent", communityEventSchema);
