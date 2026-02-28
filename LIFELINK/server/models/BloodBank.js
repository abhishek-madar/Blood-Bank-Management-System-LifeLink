const mongoose = require("mongoose");

const bloodBankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contactNumber: { type: String, required: true },
  availableBloodGroups: [
    {
      bloodGroup: { type: String, required: true },
      unitsAvailable: { type: Number, required: true, default: 0 },
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BloodBank", bloodBankSchema);
