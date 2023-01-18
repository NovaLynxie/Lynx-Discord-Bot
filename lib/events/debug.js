const logger = require('../utils/logger');
module.exports = {
  name: 'debug',
  execute(data) {
    logger.verbose(data);
  }
}