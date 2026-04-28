/**
 * Global Error Handler Middleware
 * 
 * Catches and handles uncaught errors in async route handlers.
 */

const config = require("../config/constants");
const { sendError } = require("./responseHandler");

/**
 * Global error handler for uncaught exceptions.
 * Catches errors thrown in async route handlers and other middleware.
 * Logs error details to console and returns a generic error response to client.
 *
 * @param {Error} error - The caught error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const globalErrorHandler = (error, req, res, next) => {
    // Log error details for debugging
    console.error("Error:", error);

    // Return generic error response (don't expose internal details to client)
    return sendError(res, 500, config.MESSAGES.SERVER_ERROR);
};

/**
 * 404 Not Found handler.
 * Runs if no other route matches the request.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
    return sendError(res, 404, config.MESSAGES.ROUTE_NOT_FOUND);
};

module.exports = {
    globalErrorHandler,
    notFoundHandler,
};
