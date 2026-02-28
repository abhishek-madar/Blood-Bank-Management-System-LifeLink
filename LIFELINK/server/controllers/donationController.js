const Donation = require("../models/Donation");
const User = require("../models/User");

const checkEligibility = async (req, res) => {
  try {
    const { age, weight, hasSurgery, hasIllness } = req.body;

    if (!age || !weight) {
      return res.status(400).json({ message: "Age and weight are required" });
    }

    const ageNum = parseInt(age);
    const weightNum = parseInt(weight);

    if (ageNum < 18 || ageNum > 60) {
      return res.json({
        eligible: false,
        reason: "Age must be between 18 and 60 years",
      });
    }
    if (weightNum < 50) {
      return res.json({
        eligible: false,
        reason: "Weight must be greater than 50kg",
      });
    }
    if (hasSurgery) {
      return res.json({ eligible: false, reason: "Recent surgery detected" });
    }
    if (hasIllness) {
      return res.json({ eligible: false, reason: "Serious illness detected" });
    }

    res.json({ eligible: true, reason: "Eligible to donate" });
  } catch (error) {
    console.error("Eligibility error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const createDonation = async (req, res) => {
  try {
    const { bloodGroup, donationDate, donationCenter, eligibilityStatus } =
      req.body;

    if (!bloodGroup || !donationDate || !donationCenter) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const donation = await Donation.create({
      userId: req.user._id,
      bloodGroup,
      donationDate,
      donationCenter,
      eligibilityStatus: eligibilityStatus || "eligible",
    });

    res.status(201).json({
      message: "Donation registered successfully",
      donation,
    });
  } catch (error) {
    console.error("Create donation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(donations);
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getDonationPDF = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(donation.userId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=donation-${donation._id}.pdf`,
    );

    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    doc.pipe(res);

    doc
      .fontSize(20)
      .text("LifeLink - Donation Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Donor Name: ${user.fullName}`);
    doc.text(`Blood Group: ${donation.bloodGroup}`);
    doc.text(
      `Donation Date: ${new Date(donation.donationDate).toLocaleDateString()}`,
    );
    doc.text(`Donation Center: ${donation.donationCenter}`);
    doc.text(`Status: ${donation.eligibilityStatus}`);
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Certificate ID: ${donation._id}`, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  checkEligibility,
  createDonation,
  getUserDonations,
  getDonationPDF,
};
