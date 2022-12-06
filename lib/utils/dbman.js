const logger = require('./logger');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: 'lynxbot.sqlite',
});
const databases = {
  economy: sequelize.define('economy', {
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    balance: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    inventory: DataTypes.ARRAY(DataTypes.JSON),
  }),
  moderation: sequelize.define('moderation', {
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'N/S',
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      defaultValue: 'N/S',
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    }
  }),
  music: sequelize.define('music', {
    guildId: {
      type: DataTypes.INTEGER,
      unique: true,
    },
    queue: DataTypes.ARRAY(DataTypes.JSON),
    track: {
      type: DataTypes.JSON,
      defaultValue: { title: '', duration: '', requestedBy: '' },
      allowNull: false,
    },
    volume: {
      type: DataTypes.INTEGER,
      defaultValue: 0.5, allowNull: false,
    }
  })
};
function syncAll(force = false) {
  try {
    for (const db in databases) {
      databases[db].sync({ force });
    };
  } catch (error) {
    logger.error(error); logger.debug(error.stack);
  };
};
module.exports = { db: databases, syncAll };