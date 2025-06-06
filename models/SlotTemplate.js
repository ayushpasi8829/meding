// models/SlotTemplate.js
const mongoose = require("mongoose");

const slotTemplateSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SlotTemplate", slotTemplateSchema);
