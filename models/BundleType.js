// models/BundleType.js
const mongoose = require('mongoose');

const bundleTypeSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "3 Sessions"
  sessionCount: { type: Number, required: true },
  price: { type: Number, required: true },
});

module.exports = mongoose.model('BundleType', bundleTypeSchema);
