/**
 * Slot Controller
 * 
 * Handles slot creation, retrieval, and booking logic.
 */

const SlotModel = require("../models/Slot");
const { sendError, sendSuccess } = require("../middleware/responseHandler");
const { serializeSlot } = require("../serializers/slotSerializer");
const {
    isValidEmail,
    isFutureDate,
    isValidObjectId,
    normalizeEmail,
} = require("../lib/validators");
const config = require("../config/constants");

/**
 * GET /slots
 * Retrieves all available time slots.
 */
const getAllSlots = async (req, res) => {
    try {
        const slots = await SlotModel.getAllSlots();
        return sendSuccess(res, 200, "Slots retrieved successfully", {
            slots: slots.map(serializeSlot),
        });
    } catch (error) {
        console.error("Get slots error:", error);
        return sendError(res, 500, config.MESSAGES.SLOT_LOAD_FAILED, error.message);
    }
};

/**
 * GET /slots/booked
 * Retrieves slots booked by a specific student.
 */
const getBookedSlots = async (req, res) => {
    try {
        const studentEmail = req.query?.email;

        // Validate email query parameter
        if (!isValidEmail(studentEmail)) {
            return sendError(res, 400, config.MESSAGES.INVALID_EMAIL_PARAM);
        }

        const normalizedEmail = normalizeEmail(studentEmail);
        const slots = await SlotModel.getBookedSlots(normalizedEmail);

        return sendSuccess(res, 200, "Booked slots retrieved successfully", {
            slots: slots.map(serializeSlot),
        });
    } catch (error) {
        console.error("Get booked slots error:", error);
        return sendError(res, 500, config.MESSAGES.BOOKED_SLOTS_LOAD_FAILED, error.message);
    }
};

/**
 * GET /slots/created
 * Retrieves slots created by a specific teacher.
 */
const getCreatedSlots = async (req, res) => {
    try {
        const teacherEmail = req.query?.email;

        // Validate email query parameter
        if (!isValidEmail(teacherEmail)) {
            return sendError(res, 400, config.MESSAGES.INVALID_TEACHER_EMAIL);
        }

        const normalizedEmail = normalizeEmail(teacherEmail);
        const slots = await SlotModel.getCreatedSlots(normalizedEmail);

        return sendSuccess(res, 200, "Created slots retrieved successfully", {
            slots: slots.map(serializeSlot),
        });
    } catch (error) {
        console.error("Get created slots error:", error);
        return sendError(res, 500, config.MESSAGES.CREATED_SLOTS_LOAD_FAILED, error.message);
    }
};

/**
 * POST /slots
 * Creates a new 15-minute time slot.
 */
const createSlot = async (req, res) => {
    try {
        const startInput = req.body?.start ?? req.body?.startDateTime;
        const start = new Date(startInput);

        // Validate start datetime
        if (!startInput || Number.isNaN(start.getTime())) {
            return sendError(res, 400, config.MESSAGES.INVALID_DATE);
        }

        // Prevent past slots
        if (!isFutureDate(start)) {
            return sendError(res, 400, config.MESSAGES.PAST_SLOT);
        }

        // Check for overlaps
        const end = new Date(start.getTime() + config.SLOT_DURATION_MINUTES * 60 * 1000);
        const overlappingSlot = await SlotModel.findOverlappingSlot(start, end);

        if (overlappingSlot) {
            return sendError(res, 409, config.MESSAGES.SLOT_OVERLAP);
        }

        // Normalize creator info if provided
        const createdByInput = req.body?.createdBy;
        const createdBy = isValidEmail(createdByInput)
            ? normalizeEmail(createdByInput)
            : null;
        const creatorName = req.body?.creatorName || null;

        // Create slot
        const slot = await SlotModel.createSlot({
            start,
            createdBy,
            creatorName,
        });

        return sendSuccess(res, 201, config.MESSAGES.SLOT_CREATED, {
            slot: serializeSlot(slot),
        });
    } catch (error) {
        console.error("Create slot error:", error);
        return sendError(res, 500, config.MESSAGES.SLOT_LOAD_FAILED, error.message);
    }
};

/**
 * PUT /slots/:id/book
 * Books an available slot for a student.
 */
const bookSlot = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate slot ID
        if (!isValidObjectId(id)) {
            return sendError(res, 400, config.MESSAGES.INVALID_SLOT_ID);
        }

        // Fetch slot to verify it exists and is available
        const slot = await SlotModel.findSlotById(id);
        if (!slot) {
            return sendError(res, 404, config.MESSAGES.SLOT_NOT_FOUND);
        }

        if (slot.status === config.SLOT_STATUS.BOOKED) {
            return sendError(res, 409, config.MESSAGES.SLOT_ALREADY_BOOKED);
        }

        // Normalize booker email if provided
        const bookedByInput = req.body?.bookedBy;
        const bookedBy = isValidEmail(bookedByInput)
            ? normalizeEmail(bookedByInput)
            : null;

        // Book the slot
        const updatedSlot = await SlotModel.bookSlot(id, bookedBy);

        return sendSuccess(res, 200, config.MESSAGES.SLOT_BOOKED, {
            slot: serializeSlot(updatedSlot),
        });
    } catch (error) {
        console.error("Book slot error:", error);
        return sendError(res, 500, "Failed to book slot.", error.message);
    }
};

module.exports = {
    getAllSlots,
    getBookedSlots,
    getCreatedSlots,
    createSlot,
    bookSlot,
};
