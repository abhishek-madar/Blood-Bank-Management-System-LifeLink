const express = require("express");
const router = express.Router();
const { getActiveEmergencies } = require("../controllers/emergencyController");

router.get("/active", getActiveEmergencies);

module.exports = router;
