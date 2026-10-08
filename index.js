const app = require('./src/app');
const config = require('./src/config');
const { client } = require('./src/client/whatsapp');
const { startScheduler, stopScheduler } = require('./src/jobs/scheduler');

startScheduler();

const server = app.listen(config.port, () => {
    console.log(`[SERVER] Listening on port ${config.port}`);
    client.initialize();
});

async function shutdown() {
    stopScheduler();
    try {
        await client.destroy();
    } catch (e) {}
    server.close(() => {
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
