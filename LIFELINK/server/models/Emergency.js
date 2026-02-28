const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  location: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Emergency", emergencySchema);
