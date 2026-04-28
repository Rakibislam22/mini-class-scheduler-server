/**
 * Application Configuration and Constants
 * 
 * Centralized configuration for the Mini Class Scheduler backend.
 * Environment-based settings with sensible defaults.
 */

require("dotenv").config();

const config = {
    // Server Configuration
    PORT: Number(process.env.PORT || 3000),
    NODE_ENV: process.env.NODE_ENV || "development",

    // Database Configuration
    MONGO_URI: process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/mini_class_scheduler",
    DB_NAME: process.env.DB_NAME || "mini_class_scheduler",

    // Features Configuration
    SLOT_DURATION_MINUTES: 15,
    PASSWORD_MIN_LENGTH: 6,
    PBKDF2_ITERATIONS: 120000,
    PBKDF2_ALGORITHM: "sha512",
    PBKDF2_KEY_LENGTH: 64,
    SALT_BYTES: 16,

    // Validation Rules
    VALID_ROLES: new Set(["teacher", "student"]),
    DEFAULT_ROLE: "student",
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    // Database Collections
    COLLECTIONS: {
        USERS: "users",
        SLOTS: "slots",
    },

    // Database Indexes
    INDEXES: {
        USERS_EMAIL: { key: { email: 1 }, options: { unique: true } },
        SLOTS_START: { key: { start: 1 }, options: { unique: true } },
        SLOTS_STATUS: { key: { status: 1 }, options: {} },
        SLOTS_CREATED_BY: { key: { createdBy: 1 }, options: {} },
    },

    // Slot Status Values
    SLOT_STATUS: {
        AVAILABLE: "Available",
        BOOKED: "Booked",
    },

    // Response Messages
    MESSAGES: {
        SERVER_RUNNING: "Mini Class Scheduler Server running on port",
        DB_CONNECTED: "Database connected and ready",

        // Success Messages
        REGISTRATION_SUCCESS: "Account created successfully.",
        LOGIN_SUCCESS: "Login successful.",
        SLOT_CREATED: "Slot created successfully.",
        SLOT_BOOKED: "Slot booked successfully.",

        // Error Messages
        INVALID_EMAIL: "Email and a 6+ character password are required.",
        INVALID_PASSWORD: "Email and a 6+ character password are required.",
        INVALID_ROLE: "Role must be teacher or student.",
        INVALID_NAME: "Name must be a string.",
        EMAIL_EXISTS: "An account with that email already exists.",
        INVALID_CREDENTIALS: "Invalid credentials.",
        LOGIN_FAILED: "Failed to log in.",
        REGISTER_FAILED: "Failed to register user.",

        INVALID_DATE: "A valid start datetime is required.",
        PAST_SLOT: "Past time slots cannot be added.",
        SLOT_OVERLAP: "That slot overlaps with an existing 15-minute slot.",
        SLOT_NOT_FOUND: "Slot not found.",
        SLOT_ALREADY_BOOKED: "That slot is already booked.",
        SLOT_LOAD_FAILED: "Failed to load slots.",
        BOOKED_SLOTS_LOAD_FAILED: "Failed to load booked slots.",
        CREATED_SLOTS_LOAD_FAILED: "Failed to load created slots.",

        INVALID_SLOT_ID: "A valid slot id is required.",
        INVALID_EMAIL_PARAM: "A valid student email query parameter is required.",
        INVALID_TEACHER_EMAIL: "A valid teacher email query parameter is required.",

        ROUTE_NOT_FOUND: "Route not found.",
        SERVER_ERROR: "Internal server error.",
    },
};

module.exports = config;
