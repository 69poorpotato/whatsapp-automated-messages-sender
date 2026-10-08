const express = require('express');
const { isClientReady } = require('../client/whatsapp');
const { sendMessage } = require('../services/messageService');
const config = require('../config');

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        whatsappReady: isClientReady(),
        autoMessage: {
            configured: Boolean(config.autoTarget && config.autoMessage),
            intervalMinutes: config.autoIntervalMinutes
        },
        timestamp: new Date().toISOString()
    });
});

router.post('/send', async (req, res) => {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields: 'chatId' and 'message' are both required."
        });
    }

    try {
        const { targetChatId, messageId } = await sendMessage(chatId, message);
        return res.status(200).json({
            success: true,
            chatId: targetChatId,
            messageId: messageId,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal server error while sending message'
        });
    }
});

module.exports = router;
