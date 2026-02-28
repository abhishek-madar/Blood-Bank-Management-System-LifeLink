const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, required: true },
  hospitalName: { type: String, required: true },
  urgencyLevel: {
    type: String,
    required: true,
    enum: ["normal", "urgent", "emergency"],
  },
  contactNumber: { type: String, required: true },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "approved", "completed", "cancelled"],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Request", requestSchema);
