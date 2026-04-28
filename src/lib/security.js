/**
 * Security Utilities
 * 
 * Password hashing, verification, and other security-related functions.
 */

const crypto = require("crypto");
const config = require("../config/constants");

/**
 * Hashes a password using PBKDF2 with SHA-512 algorithm.
 * Uses 120,000 iterations for enhanced security against brute-force attacks.
 *
 * @param {string} password - The plaintext password to hash
 * @param {string} [salt] - Optional salt; generates random salt if not provided
 * @returns {Object} Object containing { salt, hash } as hex strings
 */
const hashPassword = (password, salt = null) => {
    const finalSalt = salt || crypto.randomBytes(config.SALT_BYTES).toString("hex");
    const hash = crypto
        .pbkdf2Sync(
            password,
            finalSalt,
            config.PBKDF2_ITERATIONS,
            config.PBKDF2_KEY_LENGTH,
            config.PBKDF2_ALGORITHM
        )
        .toString("hex");

    return { salt: finalSalt, hash };
};

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
    try {
        const { hash } = hashPassword(password, salt);
        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(expectedHash, "hex")
        );
    } catch (error) {
        // timingSafeEqual throws if buffers are different lengths
        return false;
    }
};

module.exports = {
    hashPassword,
    verifyPassword,
};
