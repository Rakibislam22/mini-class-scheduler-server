/**
 * Slot Model
 * 
 * Database operations for class scheduling slots.
 */

const { getCollections } = require("../lib/database");
const { ObjectId } = require("mongodb");
const config = require("../config/constants");

/**
 * Creates a new slot in the database.
 *
 * @param {Object} slotData - Slot data { start, createdBy, creatorName }
 * @returns {Promise<Object>} The created slot document
 */
const createSlot = async (slotData) => {
    const { slots } = await getCollections();
    const now = new Date();

    // Calculate end time: 15 minutes after start
    const end = new Date(slotData.start.getTime() + config.SLOT_DURATION_MINUTES * 60 * 1000);

    const result = await slots.insertOne({
        start: slotData.start,
        end,
        status: config.SLOT_STATUS.AVAILABLE,
        bookedBy: null,
        bookedAt: null,
        createdBy: slotData.createdBy || null,
        creatorName: slotData.creatorName || null,
        createdAt: now,
        updatedAt: now,
    });

    // Fetch and return the created slot
    return await slots.findOne({ _id: result.insertedId });
};

/**
 * Finds a slot by ID.
 *
 * @param {string} slotId - MongoDB ObjectId as string
 * @returns {Promise<Object|null>} Slot document or null if not found
 */
const findSlotById = async (slotId) => {
    const { slots } = await getCollections();
    return await slots.findOne({ _id: new ObjectId(slotId) });
};

/**
 * Checks if a slot overlaps with the given time range.
 *
 * @param {Date} start - Start time
 * @param {Date} end - End time
 * @returns {Promise<Object|null>} Overlapping slot or null if none found
 */
const findOverlappingSlot = async (start, end) => {
    const { slots } = await getCollections();
    return await slots.findOne({
        start: { $lt: end },
        end: { $gt: start },
    });
};

/**
 * Gets all slots sorted by start time.
 *
 * @returns {Promise<Array>} Array of slot documents
 */
const getAllSlots = async () => {
    const { slots } = await getCollections();
    return await slots.find({}).sort({ start: 1 }).toArray();
};

/**
 * Gets all slots booked by a specific student.
 *
 * @param {string} email - Normalized student email
 * @returns {Promise<Array>} Array of booked slot documents
 */
const getBookedSlots = async (email) => {
    const { slots } = await getCollections();
    return await slots
        .find({ bookedBy: email, status: config.SLOT_STATUS.BOOKED })
        .sort({ start: 1 })
        .toArray();
};

/**
 * Gets all slots created by a specific teacher.
 *
 * @param {string} email - Normalized teacher email
 * @returns {Promise<Array>} Array of created slot documents
 */
const getCreatedSlots = async (email) => {
    const { slots } = await getCollections();
    return await slots
        .find({ createdBy: email })
        .sort({ start: 1 })
        .toArray();
};

/**
 * Books an available slot for a student.
 * Updates status from "Available" to "Booked" and records booking info.
 *
 * @param {string} slotId - MongoDB ObjectId as string
 * @param {string} studentEmail - Normalized student email
 * @returns {Promise<Object|null>} Updated slot document or null if not found/already booked
 */
const bookSlot = async (slotId, studentEmail) => {
    const { slots } = await getCollections();
    const objectId = new ObjectId(slotId);

    const result = await slots.updateOne(
        { _id: objectId },
        {
            $set: {
                status: config.SLOT_STATUS.BOOKED,
                bookedBy: studentEmail,
                bookedAt: new Date(),
                updatedAt: new Date(),
            },
        }
    );

    if (result.matchedCount === 0) {
        return null;
    }

    // Fetch and return the updated slot
    return await slots.findOne({ _id: objectId });
};

module.exports = {
    createSlot,
    findSlotById,
    findOverlappingSlot,
    getAllSlots,
    getBookedSlots,
    getCreatedSlots,
    bookSlot,
};
