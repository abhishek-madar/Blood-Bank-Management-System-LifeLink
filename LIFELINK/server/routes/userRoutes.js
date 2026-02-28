const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
} = require("../controllers/userController");

router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/stats", protect, getUserStats);

module.exports = router;
