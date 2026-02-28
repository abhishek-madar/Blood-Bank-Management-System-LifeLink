const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createRequest,
  getUserRequests,
  getRequestPDF,
  updateRequestStatus,
} = require("../controllers/requestController");

router.post("/", protect, createRequest);
router.get("/my-requests", protect, getUserRequests);
router.get("/pdf/:id", protect, getRequestPDF);
router.put("/:id/status", protect, updateRequestStatus);

module.exports = router;
