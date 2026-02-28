const Request = require("../models/Request");
const User = require("../models/User");
const PDFDocument = require("pdfkit");

const createRequest = async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      urgencyLevel,
      contactNumber,
    } = req.body;

    if (
      !patientName ||
      !bloodGroup ||
      !unitsRequired ||
      !hospitalName ||
      !urgencyLevel ||
      !contactNumber
    ) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const request = await Request.create({
      userId: req.user._id,
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      urgencyLevel,
      contactNumber,
      status: "pending",
    });

    res.status(201).json({
      message: "Blood request submitted successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getUserRequests = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const requests = await Request.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const getRequestPDF = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(request.userId);

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=request-${request._id}.pdf`,
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .text("LifeLink - Blood Request Details", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Requester Name: ${user.fullName}`);
    doc.text(`Patient Name: ${request.patientName}`);
    doc.text(`Blood Group: ${request.bloodGroup}`);
    doc.text(`Units Required: ${request.unitsRequired}`);
    doc.text(`Hospital: ${request.hospitalName}`);
    doc.text(`Urgency Level: ${request.urgencyLevel}`);
    doc.text(`Contact Number: ${request.contactNumber}`);
    doc.text(`Status: ${request.status}`);
    doc.moveDown();
    doc.fontSize(12).text(`Request ID: ${request._id}`, { align: "center" });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, {
      align: "center",
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    request.status = status;
    await request.save();

    res.json({
      message: "Request status updated",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createRequest,
  getUserRequests,
  getRequestPDF,
  updateRequestStatus,
};
