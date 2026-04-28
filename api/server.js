const { getCollections } = require('../src/lib/database');
const { createApp } = require('../src/server');

let app = null;
let initPromise = null;

async function init() {
    if (app) {
        console.log('[init] App already initialized, returning cached');
        return app;
    }
    if (initPromise) {
        console.log('[init] Waiting for init to complete...');
        return initPromise;
    }

    console.log('[init] Starting cold initialization...');
    initPromise = (async () => {
        try {
            console.log('[init] Initializing database connection...');
            await getCollections();
            console.log('[init] Database initialized');
            
            console.log('[init] Creating Express app...');
            app = createApp();
            console.log('[init] App created successfully');
            
            return app;
        } catch (err) {
            console.error('[init] Initialization failed:', err.message, err.stack);
            throw err;
        }
    })();

    return initPromise;
}

module.exports = async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
        const expressApp = await init();
        console.log(`[${new Date().toISOString()}] App initialized, handling request...`);
        
        // Call Express app directly as a request handler
        expressApp(req, res);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Error:`, err.message, err.stack);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: err.message
            }, null, 2));
        }
    }
};

