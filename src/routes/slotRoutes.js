/**
 * Slot Routes
 * 
 * Routes for creating, viewing, and booking class slots.
 */

const express = require("express");
const slotController = require("../controllers/slotController");

const router = express.Router();

/**
 * GET /slots
 * Retrieve all available slots
 */
router.get("/", slotController.getAllSlots);

/**
 * GET /slots/booked
 * Retrieve slots booked by a specific student
 */
router.get("/booked", slotController.getBookedSlots);

/**
 * GET /slots/created
 * Retrieve slots created by a specific teacher
 */
router.get("/created", slotController.getCreatedSlots);

/**
 * POST /slots
 * Create a new 15-minute slot
 */
router.post("/", slotController.createSlot);

/**
 * PUT /slots/:id/book
 * Book an available slot
 */
router.put("/:id/book", slotController.bookSlot);

module.exports = router;
