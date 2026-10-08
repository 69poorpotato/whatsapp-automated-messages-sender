const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');

let isReady = false;

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: config.sessionPath
    }),
    puppeteer: {
        headless: true,
        executablePath: config.puppeteerExecutablePath,
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
    console.log('[READY] WhatsApp client is ready.');

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
});

client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('[DISCONNECTED] WhatsApp client disconnected:', reason);
    client.initialize();
});

function isClientReady() {
    return isReady;
}

module.exports = {
    client,
    isClientReady
};
