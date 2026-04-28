const serverless = require('serverless-http');
const { getCollections } = require('../src/lib/database');
const { createApp } = require('../src/server');

let handler = null;
let initPromise = null;

async function init() {
    if (handler) return handler;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // initialize DB and app once per cold start
        await getCollections();
        const app = createApp();
        handler = serverless(app);
        return handler;
    })();

    return initPromise;
}

module.exports = async (req, res) => {
    try {
        const h = await init();
        return h(req, res);
    } catch (err) {
        console.error('Serverless handler initialization error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
    }
};
