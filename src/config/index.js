module.exports = {
    port: parseInt(process.env.PORT || '3000', 10),
    autoTarget: process.env.AUTO_TARGET || '',
    autoMessage: process.env.AUTO_MESSAGE || '',
    autoIntervalMinutes: parseInt(process.env.AUTO_INTERVAL_MINUTES || '3', 10),
    puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    sessionPath: process.env.SESSION_PATH || './session'
};
