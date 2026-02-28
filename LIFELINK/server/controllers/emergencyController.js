const Emergency = require("../models/Emergency");

const getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({
      expiryDate: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (error) {
    console.error("Emergency error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getActiveEmergencies };
