const config = require('../config');
const { client } = require('../client/whatsapp');
const { sendMessage } = require('../services/messageService');

let timer = null;

async function dispatchJob() {
    if (!config.autoTarget || !config.autoMessage) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[JOB] Dispatching scheduled message to ${config.autoTarget}...`);
    try {
        const { targetChatId, messageId } = await sendMessage(config.autoTarget, config.autoMessage);
        console.log(`[JOB ${timestamp}] Delivered to ${targetChatId} (ID: ${messageId})`);
    } catch (err) {
        console.error(`[JOB ${timestamp}] Error:`, err.message);
    }
}

function startScheduler() {
    if (!config.autoTarget || !config.autoMessage) return;

    client.on('ready', () => {
        dispatchJob();
        if (timer) clearInterval(timer);
        timer = setInterval(dispatchJob, config.autoIntervalMinutes * 60 * 1000);
    });

    client.on('disconnected', () => {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    });
}

function stopScheduler() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

module.exports = {
    startScheduler,
    stopScheduler
};
