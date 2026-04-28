/**
 * Database Connection Manager
 * 
 * Handles MongoDB connection initialization with lazy loading pattern.
 * Ensures single connection instance and automatic index creation.
 */

const { MongoClient } = require("mongodb");
const config = require("../config/constants");

let client;
let db;
let dbInitPromise;

/**
 * Lazily initializes MongoDB connection and retrieves collections.
 * Uses promise caching to ensure only one connection attempt.
 * Automatically creates required indexes for optimal query performance.
 *
 * @returns {Promise<{users: Collection, slots: Collection}>} MongoDB collections ready for queries
 * @throws {Error} If MongoDB connection fails
 */
const getCollections = async () => {
    if (!dbInitPromise) {
        dbInitPromise = (async () => {
            try {
                client = new MongoClient(config.MONGO_URI);
                await client.connect();
                db = client.db(config.DB_NAME);

                // Get or create MongoDB collections
                const users = db.collection(config.COLLECTIONS.USERS);
                const slots = db.collection(config.COLLECTIONS.SLOTS);

                // Create indexes for query optimization and data integrity
                await Promise.all([
                    users.createIndex(
                        config.INDEXES.USERS_EMAIL.key,
                        config.INDEXES.USERS_EMAIL.options
                    ),
                    slots.createIndex(
                        config.INDEXES.SLOTS_START.key,
                        config.INDEXES.SLOTS_START.options
                    ),
                    slots.createIndex(
                        config.INDEXES.SLOTS_STATUS.key,
                        config.INDEXES.SLOTS_STATUS.options
                    ),
                    slots.createIndex(
                        config.INDEXES.SLOTS_CREATED_BY.key,
                        config.INDEXES.SLOTS_CREATED_BY.options
                    ),
                ]);

                console.log(config.MESSAGES.DB_CONNECTED);
                return { users, slots };
            } catch (error) {
                // Reset promise on error to allow retry on next request
                dbInitPromise = null;
                throw error;
            }
        })();
    }

    return dbInitPromise;
};

/**
 * Closes the MongoDB connection.
 * Should be called during graceful shutdown.
 *
 * @returns {Promise<void>}
 */
const closeConnection = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        dbInitPromise = null;
    }
};

/**
 * Gets the database instance for direct access if needed.
 *
 * @returns {Object|null} MongoDB database instance or null if not connected
 */
const getDatabase = () => db;

module.exports = {
    getCollections,
    closeConnection,
    getDatabase,
};
