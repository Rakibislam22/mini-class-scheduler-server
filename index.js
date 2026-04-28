/**
 * Mini Class Scheduler - Application Entry Point
 * 
 * Starts the Express server and initializes database connection.
 */

const config = require("./src/config/constants");
const { createApp } = require("./src/server");
const { getCollections, closeConnection } = require("./src/lib/database");

/**
 * Starts the HTTP server and initializes database connection.
 * Handles graceful shutdown on process termination.
 */
const startServer = async () => {
    try {
        // Initialize database connection and create indexes
        await getCollections();

        // Create Express app
        const app = createApp();

        // Start HTTP server
        const server = app.listen(config.PORT, () => {
            console.log(
                `${config.MESSAGES.SERVER_RUNNING} ${config.PORT}`
            );
            console.log(`Environment: ${config.NODE_ENV}`);
        });

        // Handle graceful shutdown
        const gracefulShutdown = async (signal) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                console.log("HTTP server closed");

                try {
                    await closeConnection();
                    console.log("Database connection closed");
                    process.exit(0);
                } catch (error) {
                    console.error("Error closing database connection:", error);
                    process.exit(1);
                }
            });

            // Force exit after 30 seconds
            setTimeout(() => {
                console.error("Forced shutdown after timeout");
                process.exit(1);
            }, 30000);
        };

        // Listen for termination signals
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

// Start server if this file is executed directly
if (require.main === module) {
    startServer();
}

module.exports = { startServer };
