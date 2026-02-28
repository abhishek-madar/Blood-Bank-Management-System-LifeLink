const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/css", express.static(path.join(__dirname, "../client/css")));
app.use("/js", express.static(path.join(__dirname, "../client/js")));
app.use("/assets", express.static(path.join(__dirname, "../client/assets")));

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const donationRoutes = require("./routes/donationRoutes");
const requestRoutes = require("./routes/requestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/emergency", emergencyRoutes);

// Serve HTML pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/about.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/register.html"));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/profile.html"));
});

app.get("/donate", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/donate.html"));
});

app.get("/request", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/request.html"));
});

// 404 handler
app.use("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/pages/index.html"));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong!" });
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB if URI is provided
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => {
        console.log("✅ Connected to MongoDB");
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`   Open http://localhost:${PORT} in your browser\n`);
        });
    }).catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        console.log("\n⚠️  Starting server without database connection...");
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`   ⚠️  Database not connected - some features may not work\n`);
        });
    });
} else {
    console.log("\n⚠️  No MongoDB URI provided - starting without database...");
    app.listen(PORT, () => {
        console.log(`\n✅ Server running on http://localhost:${PORT}`);
        console.log(`   ⚠️  Database not connected - some features may not work\n`);
    });
}