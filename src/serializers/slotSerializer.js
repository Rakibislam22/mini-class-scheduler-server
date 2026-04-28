/**
 * Slot Serializer
 * 
 * Converts MongoDB slot documents to safe API response format.
 * Transforms ObjectId to string and ensures consistent field structure.
 */

/**
 * Converts a MongoDB slot document to a safe API response format.
 * Transforms ObjectId to string and ensures consistent field structure.
 *
 * @param {Object} slot - MongoDB slot document
 * @returns {Object} Serialized slot object safe for client transmission
 */
const serializeSlot = (slot) => ({
    id: slot._id.toString(),
    start: slot.start,
    end: slot.end,
    status: slot.status,
    bookedBy: slot.bookedBy || null,
    bookedAt: slot.bookedAt || null,
    createdBy: slot.createdBy || null,
    creatorName: slot.creatorName || null,
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
});

module.exports = {
    serializeSlot,
};
