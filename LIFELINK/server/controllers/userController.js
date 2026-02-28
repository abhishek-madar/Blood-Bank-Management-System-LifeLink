const User = require("../models/User");
const Donation = require("../models/Donation");
const Request = require("../models/Request");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const donations = await Donation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    const requests = await Request.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json({ user, recentDonations: donations, recentRequests: requests });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { fullName, address, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, address, phone },
      { new: true },
    ).select("-password");
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserStats = async (req, res) => {
  try {
    const donationCount = await Donation.countDocuments({
      userId: req.user._id,
    });
    const requestCount = await Request.countDocuments({ userId: req.user._id });
    const completedRequests = await Request.countDocuments({
      userId: req.user._id,
      status: "completed",
    });
    res.json({
      totalDonations: donationCount,
      totalRequests: requestCount,
      completedRequests,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getUserProfile, updateUserProfile, getUserStats };
