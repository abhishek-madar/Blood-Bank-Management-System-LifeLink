const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  checkEligibility,
  createDonation,
  getUserDonations,
  getDonationPDF,
} = require("../controllers/donationController");

router.post("/check-eligibility", protect, checkEligibility);
router.post("/", protect, createDonation);
router.get("/my-donations", protect, getUserDonations);
router.get("/pdf/:id", protect, getDonationPDF);

module.exports = router;
