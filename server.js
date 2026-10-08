const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3000;

const AUTO_TARGET = process.env.AUTO_TARGET || '';
const AUTO_MESSAGE = process.env.AUTO_MESSAGE || '';
const AUTO_INTERVAL_MINUTES = parseInt(process.env.AUTO_INTERVAL_MINUTES || '3', 10);

app.use(express.json());

let isReady = false;
let autoTimer = null;

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

async function sendMessageSafely(chatId, message) {
    let cleanNumber = String(chatId).trim().replace('@c.us', '').replace(/\D/g, '');
    let targetChatId = `${cleanNumber}@c.us`;

    try {
        const numberDetails = await client.getNumberId(cleanNumber);
        if (numberDetails && numberDetails._serialized) {
            targetChatId = numberDetails._serialized;
        }
    } catch (lookupErr) {
        console.warn(`[LOOKUP] Could not verify number ${cleanNumber} via getNumberId: ${lookupErr.message}`);
    }

    try {
        await client.pupPage.evaluate(async (jid) => {
            try {
                if (window.Store && window.Store.Chat) {
                    const wid = window.require('WAWebWidFactory').createWid(jid);
                    if (!window.Store.Chat.get(wid) && window.require('WAWebFindChatAction')) {
                        await window.require('WAWebFindChatAction').findOrCreateLatestChat(wid);
                    }
                }
            } catch (e) {}
        }, targetChatId);
    } catch (evalErr) {}

    console.log(`[SENDING] Sending message to ${targetChatId}...`);
    const sentMessage = await client.sendMessage(targetChatId, message);
    const messageId = sentMessage?.id?._serialized || sentMessage?.id?.id || 'dispatched';
    console.log(`[SENT] Message successfully delivered to ${targetChatId} (ID: ${messageId})`);

    return { targetChatId, messageId };
}

function triggerAutoMessage() {
    if (!AUTO_TARGET || !AUTO_MESSAGE) return;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[AUTO] Dispatching scheduled message to ${AUTO_TARGET}...`);
    sendMessageSafely(AUTO_TARGET, AUTO_MESSAGE)
        .then(({ targetChatId, messageId }) => {
            console.log(`[AUTO ${timestamp}] Delivered to ${targetChatId} (ID: ${messageId})`);
        })
        .catch((err) => {
            console.error(`[AUTO ${timestamp}] Error:`, err.message);
        });
}

client.on('qr', (qr) => {
    console.log('\n[QR CODE] Scan this QR code in WhatsApp:\nSettings -> Linked Devices -> Link a Device\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('[AUTH] Authentication successful.');
});

client.on('auth_failure', (msg) => {
    console.error('[AUTH ERROR] Authentication failed:', msg);
});

client.on('ready', async () => {
    isReady = true;
    console.log('[READY] WhatsApp Web client is connected.');
    console.log(`[READY] REST endpoint active at: http://localhost:${PORT}/send`);

    try {
        await client.pupPage.evaluate(() => {
            try {
                if (window.WWebJS && window.WWebJS.injectToFunction) {
                    window.WWebJS.injectToFunction(
                        { module: 'WAWebLid1X1MigrationGating', function: 'Lid1X1MigrationUtils.isLidMigrated' },
                        () => false
                    );
                    window.WWebJS.injectToFunction(
                        { module: 'WAWebLid1X1MigrationGating', function: 'shouldHaveAccountLid' },
                        () => false
                    );
                }
            } catch (e) {}
        });
    } catch (e) {}

    if (AUTO_TARGET && AUTO_MESSAGE) {
        triggerAutoMessage();
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = setInterval(triggerAutoMessage, AUTO_INTERVAL_MINUTES * 60 * 1000);
    }
});

client.on('disconnected', (reason) => {
    isReady = false;
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
    }
    console.warn('[DISCONNECTED] WhatsApp Web client disconnected:', reason);
    client.initialize();
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        whatsappReady: isReady,
        autoMessage: {
            configured: Boolean(AUTO_TARGET && AUTO_MESSAGE),
            intervalMinutes: AUTO_INTERVAL_MINUTES
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/send', async (req, res) => {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields: 'chatId' and 'message' are both required."
        });
    }

    if (!isReady) {
        return res.status(503).json({
            success: false,
            error: 'WhatsApp client is not ready. Please scan the QR code and wait for ready state.'
        });
    }

    try {
        const { targetChatId, messageId } = await sendMessageSafely(chatId, message);
        return res.status(200).json({
            success: true,
            chatId: targetChatId,
            messageId: messageId,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(`[ERROR] Failed to send message to ${chatId}:`, err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error while sending WhatsApp message'
        });
    }
});

const shutdown = async () => {
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
    }
    try {
        await client.destroy();
    } catch (e) {}
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(PORT, () => {
    console.log(`[SERVER] REST bridge listening on http://localhost:${PORT}`);
    client.initialize();
});
