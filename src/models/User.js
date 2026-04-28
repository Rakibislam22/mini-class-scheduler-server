/**
 * User Model
 * 
 * Database operations for user accounts.
 */

const { getCollections } = require("../lib/database");
const config = require("../config/constants");

/**
 * Creates a new user account in the database.
 *
 * @param {Object} userData - User data { name, email, passwordHash, passwordSalt, role }
 * @returns {Promise<Object>} The created user document
 */
const createUser = async (userData) => {
    const { users } = await getCollections();
    const now = new Date();

    const result = await users.insertOne({
        name: userData.name || null,
        email: userData.email,
        role: userData.role || config.DEFAULT_ROLE,
        passwordSalt: userData.passwordSalt,
        passwordHash: userData.passwordHash,
        createdAt: now,
        updatedAt: now,
    });

    // Fetch and return the created user
    return await users.findOne({ _id: result.insertedId });
};

/**
 * Finds a user by email address.
 *
 * @param {string} email - Normalized email address
 * @returns {Promise<Object|null>} User document or null if not found
 */
const findUserByEmail = async (email) => {
    const { users } = await getCollections();
    return await users.findOne({ email });
};

/**
 * Finds a user by ID.
 *
 * @param {ObjectId} userId - MongoDB ObjectId
 * @returns {Promise<Object|null>} User document or null if not found
 */
const findUserById = async (userId) => {
    const { users } = await getCollections();
    const { ObjectId } = require("mongodb");
    return await users.findOne({ _id: new ObjectId(userId) });
};

/**
 * Checks if a user with the given email exists.
 *
 * @param {string} email - Normalized email address
 * @returns {Promise<boolean>} True if user exists, false otherwise
 */
const userExists = async (email) => {
    const user = await findUserByEmail(email);
    return user !== null;
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    userExists,
};
