/**
 * Input Validation Utilities
 * 
 * Reusable validation functions for common data types and formats.
 */

const config = require("../config/constants");

/**
 * Validates an email address format using a regular expression pattern.
 * Checks for basic email structure: localpart@domain.extension
 *
 * @param {*} value - The value to validate (any type)
 * @returns {boolean} True if value is a string and matches email pattern
 */
const isValidEmail = (value) => {
    return (
        typeof value === "string" &&
        config.EMAIL_REGEX.test(value.trim())
    );
};

/**
 * Validates that a password meets minimum length requirements.
 *
 * @param {*} password - The password to validate
 * @returns {boolean} True if password is a string and meets minimum length
 */
const isValidPassword = (password) => {
    return (
        typeof password === "string" &&
        password.trim().length >= config.PASSWORD_MIN_LENGTH
    );
};

/**
 * Validates that a user role is one of the allowed values.
 *
 * @param {*} role - The role to validate
 * @returns {boolean} True if role is in the VALID_ROLES set
 */
const isValidRole = (role) => config.VALID_ROLES.has(role);

/**
 * Normalizes an email address: lowercase and trimmed.
 * Should be called on all emails before database operations.
 *
 * @param {string} email - The email to normalize
 * @returns {string} Normalized email (lowercase, trimmed)
 */
const normalizeEmail = (email) => {
    return email.trim().toLowerCase();
};

/**
 * Validates a MongoDB ObjectId format (24-character hex string).
 *
 * @param {string} id - The ID to validate
 * @returns {boolean} True if ID is a valid 24-character hex string
 */
const isValidObjectId = (id) => {
    return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Validates that a date is in the future.
 *
 * @param {Date} date - The date to validate
 * @returns {boolean} True if date is strictly in the future
 */
const isFutureDate = (date) => {
    return date > new Date();
};

/**
 * Validates that a value is a string or null.
 *
 * @param {*} value - The value to validate
 * @returns {boolean} True if value is a string or null
 */
const isStringOrNull = (value) => {
    return value === null || typeof value === "string";
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidRole,
    isValidObjectId,
    isFutureDate,
    isStringOrNull,
    normalizeEmail,
};
