/**
 * Health Check Routes
 * 
 * Routes for server health and status checks.
 */

const express = require("express");
const { sendSuccess } = require("../middleware/responseHandler");

const router = express.Router();

/**
 * GET /
 * Health check endpoint - verifies server is running
 */
router.get("/", (req, res) => {
    return sendSuccess(res, 200, "Welcome to the Mini Class Scheduler Server.");
});

module.exports = router;
