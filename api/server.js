const serverless = require('serverless-http');
const { getCollections } = require('../src/lib/database');
const { createApp } = require('../src/server');

let handler = null;
let initPromise = null;

async function init() {
    if (handler) {
        console.log('[init] Handler already initialized, returning cached');
        return handler;
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
            const app = createApp();
            console.log('[init] App created');
            
            console.log('[init] Wrapping app with serverless-http...');
            handler = serverless(app);
            console.log('[init] Handler created successfully');
            
            return handler;
        } catch (err) {
            console.error('[init] Initialization failed:', err.message);
            throw err;
        }
    })();

    return initPromise;
}

module.exports = async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.url}`);
        const h = await init();
        console.log(`[${new Date().toISOString()}] Handler initialized, invoking...`);
        if (typeof h !== 'function') {
            throw new Error(`Handler is not a function: ${typeof h}`);
        }
        return h(req, res);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] Serverless handler error:`, err.message, err.stack);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
                error: 'Internal Server Error',
                message: err.message,
                type: err.constructor.name
            }, null, 2));
        }
    }
};
