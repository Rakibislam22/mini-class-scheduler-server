/**
 * Mini Class Scheduler - Express Server
 * 
 * Main server application configuration and setup.
 * Mounts routes, middleware, and error handlers.
 */

const express = require("express");
const cors = require("cors");
const config = require("./config/constants");

// Import routes
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const slotRoutes = require("./routes/slotRoutes");

// Import middleware
const { globalErrorHandler, notFoundHandler } = require("./middleware/errorHandler");

/**
 * Creates and configures the Express application
 * 
 * @returns {Object} Configured Express application
 */
const createApp = () => {
    const app = express();

    // ==================== MIDDLEWARE ====================

    // Enable CORS for all routes
    app.use(cors());

    // Parse incoming JSON payloads
    app.use(express.json());

    // ==================== ROUTES ====================

    // Health check
    app.use("/", healthRoutes);

    // Authentication routes
    app.use("/api", authRoutes);

    // Slot management routes
    app.use("/slots", slotRoutes);

    // ==================== ERROR HANDLERS ====================

    // 404 handler (must come before global error handler)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(globalErrorHandler);

    return app;
};

module.exports = {
    createApp,
};
