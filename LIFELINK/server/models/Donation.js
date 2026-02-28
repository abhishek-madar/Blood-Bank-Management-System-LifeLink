const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bloodGroup: {
    type: String,
    required: true,
  },
  donationDate: {
    type: Date,
    required: true,
  },
  donationCenter: {
    type: String,
    required: true,
  },
  eligibilityStatus: {
    type: String,
    required: true,
    enum: ["eligible", "not-eligible"],
    default: "eligible",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Donation", donationSchema);
