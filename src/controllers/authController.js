/**
 * Authentication Controller
 * 
 * Handles user registration and login logic.
 */

const UserModel = require("../models/User");
const { hashPassword, verifyPassword } = require("../lib/security");
const { sendError, sendSuccess } = require("../middleware/responseHandler");
const { serializeUser } = require("../serializers/userSerializer");
const {
    isValidEmail,
    isValidPassword,
    isValidRole,
    normalizeEmail,
    isStringOrNull,
} = require("../lib/validators");
const config = require("../config/constants");

/**
 * POST /api/register
 * Registers a new user account.
 */
const register = async (req, res) => {
    try {
        const { name = null, email, password, role = config.DEFAULT_ROLE } = req.body || {};

        // Validate name if provided
        if (!isStringOrNull(name)) {
            return sendError(res, 400, config.MESSAGES.INVALID_NAME);
        }

        // Validate email and password
        if (!isValidEmail(email) || !isValidPassword(password)) {
            return sendError(res, 400, config.MESSAGES.INVALID_EMAIL);
        }

        // Validate role
        if (!isValidRole(role)) {
            return sendError(res, 400, config.MESSAGES.INVALID_ROLE);
        }

        const normalizedEmail = normalizeEmail(email);

        // Check if user already exists
        if (await UserModel.userExists(normalizedEmail)) {
            return sendError(res, 409, config.MESSAGES.EMAIL_EXISTS);
        }

        // Hash password
        const { salt, hash } = hashPassword(password.trim());

        // Create user
        const user = await UserModel.createUser({
            name: name ? name.trim() : null,
            email: normalizedEmail,
            passwordHash: hash,
            passwordSalt: salt,
            role,
        });

        return sendSuccess(res, 201, config.MESSAGES.REGISTRATION_SUCCESS, {
            user: serializeUser(user),
        });
    } catch (error) {
        console.error("Registration error:", error);
        return sendError(res, 500, config.MESSAGES.REGISTER_FAILED, error.message);
    }
};

/**
 * POST /api/login
 * Authenticates a user and returns their profile.
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        // Validate required fields
        if (!isValidEmail(email) || typeof password !== "string") {
            return sendError(res, 400, config.MESSAGES.INVALID_EMAIL);
        }

        const normalizedEmail = normalizeEmail(email);

        // Look up user
        const user = await UserModel.findUserByEmail(normalizedEmail);
        if (!user) {
            return sendError(res, 401, config.MESSAGES.INVALID_CREDENTIALS);
        }

        // Verify password using timing-safe comparison
        const passwordMatches = verifyPassword(password.trim(), user.passwordSalt, user.passwordHash);
        if (!passwordMatches) {
            return sendError(res, 401, config.MESSAGES.INVALID_CREDENTIALS);
        }

        return sendSuccess(res, 200, config.MESSAGES.LOGIN_SUCCESS, {
            user: serializeUser(user),
        });
    } catch (error) {
        console.error("Login error:", error);
        return sendError(res, 500, config.MESSAGES.LOGIN_FAILED, error.message);
    }
};

module.exports = {
    register,
    login,
};
