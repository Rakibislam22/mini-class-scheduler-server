/**
 * Mini Class Scheduler - Backend Server
 *
 * A Node.js/Express API server that manages class scheduling with MongoDB persistence.
 * Supports user authentication, slot creation, and booking management for teachers and students.
 *
 * Features:
 * - User registration and login with password hashing (PBKDF2/SHA-512)
 * - Teachers can create 15-minute classroom time slots
 * - Students can browse available slots and book them
 * - Email normalization for consistency and uniqueness
 * - Overlap prevention for slot creation
 * - MongoDB integration with indexed collections for performance
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");

// Load environment variables from .env file
dotenv.config();

// Initialize Express application and configure middleware
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse incoming JSON payloads

// Server configuration from environment variables or defaults
const PORT = Number(process.env.PORT || 3000);
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mini_class_scheduler";
const DB_NAME = process.env.DB_NAME || "mini_class_scheduler";
const SLOT_DURATION_MINUTES = 15; // Standard 15-minute slot duration
const VALID_ROLES = new Set(["teacher", "student"]); // Allowed user roles

// MongoDB connection state management - lazy initialization
let client;
let db;
let dbInitPromise; // Ensures single connection attempt

/**
 * Hashes a password using PBKDF2 with SHA-512 algorithm.
 * Uses 120,000 iterations for enhanced security against brute-force attacks.
 *
 * @param {string} password - The plaintext password to hash
 * @param {string} [salt] - Optional salt; generates random 16-byte hex salt if not provided
 * @returns {Object} Object containing { salt, hash } as hex strings
 */
const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => ({
    salt,
    hash: crypto.pbkdf2Sync(password, salt, 120000, 64, "sha512").toString("hex"),
});

/**
 * Verifies a plaintext password against a stored hash using timing-safe comparison.
 * Prevents timing attacks that could reveal password information.
 *
 * @param {string} password - The plaintext password to verify
 * @param {string} salt - The salt used during original hashing
 * @param {string} expectedHash - The previously stored hash to compare against
 * @returns {boolean} True if password matches the hash, false otherwise
 */
const verifyPassword = (password, salt, expectedHash) => {
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
};

/**
 * Validates an email address format using a regular expression pattern.
 * Checks for basic email structure: localpart@domain.extension
 *
 * @param {*} value - The value to validate (any type)
 * @returns {boolean} True if value is a string and matches email pattern
 */
const isValidEmail = (value) => typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Converts a MongoDB user document to a safe API response format.
 * Excludes sensitive fields like password hash and salt.
 *
 * @param {Object} user - MongoDB user document with _id, name, email, role, createdAt
 * @returns {Object} Serialized user object safe for client transmission
 */
const serializeUser = (user) => ({
    id: user._id.toString(),
    name: user.name ?? null,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

/**
 * Converts a MongoDB slot document to a safe API response format.
 * Transforms ObjectId to string and ensures consistent field structure.
 *
 * @param {Object} slot - MongoDB slot document with all scheduling fields
 * @returns {Object} Serialized slot object safe for client transmission
 */
const serializeSlot = (slot) => ({
    id: slot._id.toString(),
    start: slot.start,
    end: slot.end,
    status: slot.status,
    bookedBy: slot.bookedBy ?? null,
    bookedAt: slot.bookedAt ?? null,
    createdBy: slot.createdBy ?? null,
    creatorName: slot.creatorName ?? null,
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
});

/**
 * Lazily initializes MongoDB connection and retrieves collections.
 * Uses promise caching to ensure only one connection attempt.
 * Automatically creates required indexes for optimal query performance.
 *
 * Index structure:
 * - users.email: unique (prevents duplicate accounts)
 * - slots.start: unique (prevents slot time collisions)
 * - slots.status: standard (speeds up availability queries)
 *
 * @returns {Promise<{users: Collection, slots: Collection}>} MongoDB collections ready for queries
 * @throws {Error} If MongoDB connection fails or database initialization encounters an error
 */
const getCollections = async () => {
    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            client = new MongoClient(MONGO_URI);
            await client.connect();
            db = client.db(DB_NAME);

            // Get or create MongoDB collections
            const users = db.collection("users");
            const slots = db.collection("slots");

            // Create indexes for query optimization and data integrity
            await Promise.all([
                users.createIndex({ email: 1 }, { unique: true }), // Ensure email uniqueness
                slots.createIndex({ start: 1 }, { unique: true }), // Prevent overlapping slots
                slots.createIndex({ status: 1 }), // Speed up availability filtering
            ]);

            return { users, slots };
        })().catch((error) => {
            // Reset promise on error to allow retry on next request
            dbInitPromise = null;
            throw error;
        });
    }

    return dbInitPromise;
};

/**
 * Sends a standardized error response in JSON format.
 * Utility function for consistent error handling across all routes.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 400, 401, 500)
 * @param {string} message - User-friendly error message displayed to client
 * @param {string} [details] - Optional technical error details for debugging
 * @returns {Object} Sent JSON response with error structure
 */
const sendError = (res, statusCode, message, details) => res.status(statusCode).json({
    success: false,
    message,
    details,
});

// ==================== API ROUTES ====================

/**
 * GET /
 * Health check endpoint - verifies that the server is running and accessible.
 * Returns a simple success message with no parameters required.
 */
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Mini Class Scheduler Server.",
    });
});

/**
 * POST /api/register
 * Creates a new user account with email, password, name, and role.
 * Validates input, hashes password, and stores user in MongoDB.
 * Prevents duplicate email registrations through unique index constraint.
 *
 * Request body:
 * {
 *   name?: string - Optional user display name, trimmed to 256 chars
 *   email: string - Required, must be valid email format
 *   password: string - Required, minimum 6 characters
 *   role?: 'teacher' | 'student' - Defaults to 'student' if not provided
 * }
 *
 * Responses:
 * - 201 Created: Account successfully created, returns serialized user object
 * - 400 Bad Request: Invalid email, short password, invalid role, or malformed name
 * - 409 Conflict: Account with that email already exists
 * - 500 Internal Server Error: Database error or other server issue
 */
app.post("/api/register", async (req, res) => {
    try {
        const { name = null, email, password, role = "student" } = req.body ?? {};

        // Validate name if provided - must be string or null
        if (name !== null && typeof name !== "string") {
            return sendError(res, 400, "Name must be a string.");
        }

        // Validate email format and password strength
        if (!isValidEmail(email) || typeof password !== "string" || password.trim().length < 6) {
            return sendError(res, 400, "Email and a 6+ character password are required.");
        }

        // Validate role is one of the allowed values
        if (!VALID_ROLES.has(role)) {
            return sendError(res, 400, "Role must be teacher or student.");
        }

        const { users } = await getCollections();
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user with this email already exists
        const existingUser = await users.findOne({ email: normalizedEmail });
        if (existingUser) {
            return sendError(res, 409, "An account with that email already exists.");
        }

        // Hash password using PBKDF2-SHA512 with random salt
        const { salt, hash } = hashPassword(password.trim());
        const now = new Date();

        // Insert new user document into MongoDB users collection
        const insertResult = await users.insertOne({
            name: name ? name.trim() : null,
            email: normalizedEmail,
            role,
            passwordSalt: salt,
            passwordHash: hash,
            createdAt: now,
            updatedAt: now,
        });

        // Fetch the newly created user to confirm insertion
        const user = await users.findOne({ _id: insertResult.insertedId });

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: serializeUser(user),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to register user.", error.message);
    }
});

/**
 * POST /api/login
 * Authenticates a user by email and password.
 * Returns user object on successful authentication.
 * Uses timing-safe password comparison to prevent timing attacks.
 *
 * Request body:
 * {
 *   email: string - User email address
 *   password: string - User password
 * }
 *
 * Responses:
 * - 200 OK: Authentication successful, returns serialized user object
 * - 400 Bad Request: Missing or invalid email format
 * - 401 Unauthorized: User not found or password doesn't match
 * - 500 Internal Server Error: Database error or other server issue
 */
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        // Validate required fields
        if (!isValidEmail(email) || typeof password !== "string") {
            return sendError(res, 400, "Email and password are required.");
        }

        const { users } = await getCollections();
        const normalizedEmail = email.trim().toLowerCase();

        // Look up user by normalized email
        const user = await users.findOne({ email: normalizedEmail });
        if (!user) {
            // Return generic message to prevent email enumeration
            return sendError(res, 401, "Invalid credentials.");
        }

        // Verify password using timing-safe comparison
        const passwordMatches = verifyPassword(password.trim(), user.passwordSalt, user.passwordHash);
        if (!passwordMatches) {
            return sendError(res, 401, "Invalid credentials.");
        }

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: serializeUser(user),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to log in.", error.message);
    }
});

/**
 * GET /slots
 * Retrieves all available time slots sorted by start time (earliest first).
 * Used by students to browse available slots and teachers to see all slots.
 * No authentication required - slots are public information.
 *
 * Query parameters: None
 *
 * Responses:
 * - 200 OK: Returns array of all serialized slot objects (can be empty)
 * - 500 Internal Server Error: Database connection or query error
 */
app.get("/slots", async (req, res) => {
    try {
        const { slots } = await getCollections();

        // Retrieve all slots sorted by start time ascending (earliest first)
        const slotList = await slots.find({}).sort({ start: 1 }).toArray();

        return res.status(200).json({
            success: true,
            slots: slotList.map(serializeSlot),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to load slots.", error.message);
    }
});

/**
 * GET /slots/booked
 * Retrieves all slots that have been booked by a specific student.
 * Filters by bookedBy email and status="Booked".
 * Results are sorted by start time (earliest first).
 *
 * Query parameters:
 * - email: string - Student email address (required, must be valid format)
 *
 * Responses:
 * - 200 OK: Returns array of booked slots for the student (can be empty)
 * - 400 Bad Request: Missing or invalid email query parameter
 * - 500 Internal Server Error: Database connection or query error
 */
app.get("/slots/booked", async (req, res) => {
    try {
        const studentEmail = req.query?.email;

        // Validate email query parameter is provided and valid
        if (!isValidEmail(studentEmail)) {
            return sendError(res, 400, "A valid student email query parameter is required.");
        }

        const normalizedEmail = studentEmail.trim().toLowerCase();
        const { slots } = await getCollections();

        // Find all booked slots for this student (status must be "Booked")
        const slotList = await slots
            .find({ bookedBy: normalizedEmail, status: "Booked" })
            .sort({ start: 1 })
            .toArray();

        return res.status(200).json({
            success: true,
            slots: slotList.map(serializeSlot),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to load booked slots.", error.message);
    }
});

/**
 * GET /slots/created
 * Retrieves all time slots created by a specific teacher.
 * Filters by createdBy email (regardless of current booking status).
 * Results are sorted by start time (earliest first).
 *
 * Query parameters:
 * - email: string - Teacher email address (required, must be valid format)
 *
 * Responses:
 * - 200 OK: Returns array of slots created by the teacher (can be empty)
 * - 400 Bad Request: Missing or invalid email query parameter
 * - 500 Internal Server Error: Database connection or query error
 */
app.get("/slots/created", async (req, res) => {
    try {
        const teacherEmail = req.query?.email;

        // Validate email query parameter is provided and valid
        if (!isValidEmail(teacherEmail)) {
            return sendError(res, 400, "A valid teacher email query parameter is required.");
        }

        const normalizedEmail = teacherEmail.trim().toLowerCase();
        const { slots } = await getCollections();

        // Find all slots created by this teacher (includes both Available and Booked slots)
        const slotList = await slots
            .find({ createdBy: normalizedEmail })
            .sort({ start: 1 })
            .toArray();

        return res.status(200).json({
            success: true,
            slots: slotList.map(serializeSlot),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to load created slots.", error.message);
    }
});

/**
 * POST /slots
 * Creates a new 15-minute time slot for students to book.
 * Validates datetime, prevents past times, checks for overlapping slots.
 * Records teacher/creator information if provided.
 *
 * Request body:
 * {
 *   start: string - ISO 8601 datetime string (required, must be future time)
 *   createdBy?: string - Teacher email address (optional, stored in lowercase)
 *   creatorName?: string - Teacher display name (optional)
 * }
 *
 * Validations:
 * - start must be a valid future datetime (not in the past)
 * - 15-minute duration is fixed (end = start + 15 minutes)
 * - No overlapping with existing slots (checked against start < end and end > start)
 * - createdBy is normalized to lowercase if valid email format
 *
 * Responses:
 * - 201 Created: Slot successfully created, returns serialized slot object
 * - 400 Bad Request: Missing/invalid start time or past datetime
 * - 409 Conflict: Slot overlaps with existing slot at same time
 * - 500 Internal Server Error: Database error
 */
app.post("/slots", async (req, res) => {
    try {
        const startInput = req.body?.start ?? req.body?.startDateTime;
        const start = new Date(startInput);

        // Validate start datetime is provided and can be parsed
        if (!startInput || Number.isNaN(start.getTime())) {
            return sendError(res, 400, "A valid start datetime is required.");
        }

        // Prevent scheduling slots in the past
        if (start <= new Date()) {
            return sendError(res, 400, "Past time slots cannot be added.");
        }

        // Calculate end time: exactly 15 minutes after start
        const end = new Date(start.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);
        const { slots } = await getCollections();

        // Check for overlaps: look for any slot that starts before this ends and ends after this starts
        const overlappingSlot = await slots.findOne({
            start: { $lt: end },
            end: { $gt: start },
        });

        if (overlappingSlot) {
            return sendError(res, 409, "That slot overlaps with an existing 15-minute slot.");
        }

        // Normalize creator email if provided and valid
        const createdByInput = req.body?.createdBy ?? null;
        const createdBy = isValidEmail(createdByInput) ? createdByInput.trim().toLowerCase() : null;
        const creatorName = req.body?.creatorName ?? null;

        const now = new Date();

        // Insert new slot document with initial status "Available"
        const insertResult = await slots.insertOne({
            start,
            end,
            status: "Available", // Slots start as available for booking
            bookedBy: null, // No one has booked it yet
            bookedAt: null,
            createdBy, // Teacher who created this slot
            creatorName, // Teacher display name
            createdAt: now,
            updatedAt: now,
        });

        // Fetch the newly created slot to confirm insertion
        const slot = await slots.findOne({ _id: insertResult.insertedId });

        return res.status(201).json({
            success: true,
            message: "Slot created successfully.",
            slot: serializeSlot(slot),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to create slot.", error.message);
    }
});

/**
 * PUT /slots/:id/book
 * Books an available slot for a student.
 * Transitions slot status from "Available" to "Booked".
 * Records the student's email and booking timestamp.
 *
 * URL parameters:
 * - id: string - MongoDB ObjectId of the slot to book
 *
 * Request body:
 * {
 *   bookedBy?: string - Student email address (optional, stored in lowercase)
 * }
 *
 * Validations:
 * - id must be a valid MongoDB ObjectId (24-character hex string)
 * - slot must exist and have status "Available" (cannot book already-booked slots)
 * - bookedBy is normalized to lowercase if valid email format
 *
 * Responses:
 * - 200 OK: Slot successfully booked, returns updated serialized slot
 * - 400 Bad Request: Invalid slot ID format
 * - 404 Not Found: Slot with given ID doesn't exist
 * - 409 Conflict: Slot is already booked by someone else
 * - 500 Internal Server Error: Database error
 */
app.put("/slots/:id/book", async (req, res) => {
    try {
        const { id } = req.params;

        // Validate id is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
            return sendError(res, 400, "A valid slot id is required.");
        }

        const { slots } = await getCollections();
        const slotId = new ObjectId(id);

        // Retrieve the slot to book
        const slot = await slots.findOne({ _id: slotId });
        if (!slot) {
            return sendError(res, 404, "Slot not found.");
        }

        // Prevent booking already-booked slots
        if (slot.status === "Booked") {
            return sendError(res, 409, "That slot is already booked.");
        }

        // Normalize booker email if provided and valid
        const bookedByInput = req.body?.bookedBy ?? null;
        const bookedBy = isValidEmail(bookedByInput) ? bookedByInput.trim().toLowerCase() : null;

        // Update slot: change status to "Booked" and record booking information
        const updateResult = await slots.updateOne(
            { _id: slotId },
            {
                $set: {
                    status: "Booked", // Mark as booked
                    bookedBy, // Record who booked it
                    bookedAt: new Date(), // Record when it was booked
                    updatedAt: new Date(), // Update modification timestamp
                },
            },
        );

        // Verify the update was successful
        if (!updateResult.matchedCount) {
            return sendError(res, 404, "Slot not found.");
        }

        // Fetch and return the updated slot
        const updatedSlot = await slots.findOne({ _id: slotId });

        return res.status(200).json({
            success: true,
            message: "Slot booked successfully.",
            slot: serializeSlot(updatedSlot),
        });
    } catch (error) {
        return sendError(res, 500, "Failed to book slot.", error.message);
    }
});

// ==================== ERROR HANDLERS ====================

/**
 * Catch-all 404 handler for undefined routes.
 * Runs if no other route matches the request.
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

/**
 * Global error handler for uncaught exceptions.
 * Catches errors thrown in async route handlers and other middleware.
 * Logs error details to console and returns a generic error response to client.
 *
 * @param {Error} error - The caught error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
app.use((error, req, res, next) => {
    // Log error details for debugging
    console.error(error);

    // Return generic error response (don't expose internal details to client)
    res.status(500).json({
        success: false,
        message: "Internal server error.",
    });
});

// ==================== SERVER STARTUP ====================

/**
 * Initializes MongoDB connection and starts the Express server.
 * Connects to MongoDB database and listens on the specified PORT.
 * Should be called once at application startup.
 *
 * @throws {Error} If MongoDB connection fails
 */
const startServer = async () => {
    // Initialize database connection and create indexes
    await getCollections();

    // Start Express HTTP server
    app.listen(PORT, () => {
        console.log(`Scheduler Server running on port ${PORT}`);
    });
};

// Only start server if this file is executed directly (not imported as a module for testing)
if (require.main === module) {
    startServer().catch((error) => {
        console.error("Failed to start server:", error);
        process.exit(1);
    });
}

// Export for testing and programmatic usage
module.exports = { app, startServer, getCollections };