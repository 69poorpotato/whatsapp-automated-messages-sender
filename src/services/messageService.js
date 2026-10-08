const { client, isClientReady } = require('../client/whatsapp');

async function sendMessage(chatId, message) {
    if (!isClientReady()) {
        const err = new Error('WhatsApp client is not ready.');
        err.statusCode = 503;
        throw err;
    }

    let cleanNumber = String(chatId).trim().replace('@c.us', '').replace(/\D/g, '');
    let targetChatId = `${cleanNumber}@c.us`;

    try {
        const numberDetails = await client.getNumberId(cleanNumber);
        if (numberDetails && numberDetails._serialized) {
            targetChatId = numberDetails._serialized;
        }
    } catch (lookupErr) {
        console.warn(`[LOOKUP] Could not verify number ${cleanNumber}: ${lookupErr.message}`);
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
    console.log(`[SENT] Message delivered to ${targetChatId} (ID: ${messageId})`);

    return { targetChatId, messageId };
}

module.exports = {
    sendMessage
};
