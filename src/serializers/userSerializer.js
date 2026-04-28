/**
 * User Serializer
 * 
 * Converts MongoDB user documents to safe API response format.
 * Excludes sensitive fields like password hash and salt.
 */

/**
 * Converts a MongoDB user document to a safe API response format.
 * Excludes sensitive fields like password hash and salt.
 *
 * @param {Object} user - MongoDB user document
 * @returns {Object} Serialized user object safe for client transmission
 */
const serializeUser = (user) => ({
    id: user._id.toString(),
    name: user.name || null,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

module.exports = {
    serializeUser,
};
