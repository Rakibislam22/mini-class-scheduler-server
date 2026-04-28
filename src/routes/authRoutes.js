/**
 * Authentication Routes
 * 
 * Routes for user registration and login.
 */

const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

/**
 * POST /api/register
 * Register a new user account
 */
router.post("/register", authController.register);

/**
 * POST /api/login
 * Authenticate user by email and password
 */
router.post("/login", authController.login);

module.exports = router;
