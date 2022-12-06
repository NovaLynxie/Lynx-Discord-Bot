const { version } = require('./package.json');
const logger = require('./lib/utils/logger');
const http = require("http");
const host = 'localhost', port = 8000;
const requestListener = function (req, res) {
    res.writeHead(200);
    res.end("Ping Header - LYNXBOT");
};
const server = http.createServer(requestListener);
server.listen(port, host, () => {
    logger.init(`Server is running on http://${host}:${port}`);
});
console.log('LYNX DISCORD BOT ON REPLIT');
console.log(`App Version: v${version}`, `NodeJS Version: ${process.version}`);
console.log('---------------------------------------------');
logger.init('Starting Bot'); require('./lib/bot.js');