/**
 * Response Handler Middleware
 * 
 * Utilities for sending standardized JSON responses.
 */

const config = require("../config/constants");

/**
 * Sends a standardized error response in JSON format.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 400, 401, 500)
 * @param {string} message - User-friendly error message
 * @param {string} [details] - Optional technical error details for debugging
 * @returns {Object} Sent JSON response with error structure
 */
const sendError = (res, statusCode, message, details = null) => {
    const response = {
        success: false,
        message,
    };

    // Only include details in development mode
    if (config.NODE_ENV === "development" && details) {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Sends a standardized success response in JSON format.
 *
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (e.g., 200, 201)
 * @param {string} message - Success message
 * @param {Object} data - Data to include in response
 * @returns {Object} Sent JSON response with success structure
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message,
    };

    if (data) {
        Object.assign(response, data);
    }

    return res.status(statusCode).json(response);
};

module.exports = {
    sendError,
    sendSuccess,
};
