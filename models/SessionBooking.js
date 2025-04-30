const mongoose = require("mongoose");

const sessionBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapyType: { type: String, required: true }, 
  sessionDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  price: { type: Number, required: true },
  isFounderDiscount: { type: Boolean, default: false },
  couponCode: { type: String, default: null },
  finalPrice: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
  paymentId: { type: String, default: null }, 
  confirmationSent: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("SessionBooking", sessionBookingSchema);
