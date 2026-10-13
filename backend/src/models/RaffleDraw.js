const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const RaffleDraw = sequelize.define('RaffleDraw', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  winnerId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  winnerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  participantCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  drawnAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'raffle_draws',
  timestamps: true
});

RaffleDraw.associate = (models) => {
  RaffleDraw.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  RaffleDraw.belongsTo(models.User, { foreignKey: 'winnerId', as: 'winner' });
};

module.exports = RaffleDraw;
