const logger = require('../utils/logger');
module.exports = {
  name: 'error',
  execute(error) {
    logger.error('Error occured in bot application!');
    logger.error(error); logger.debug(error.stack);
  }
}