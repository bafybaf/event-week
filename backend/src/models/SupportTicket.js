const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'open'
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'support_tickets',
  timestamps: true
});

SupportTicket.associate = (models) => {
  SupportTicket.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  SupportTicket.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  SupportTicket.hasMany(models.SupportMessage, { foreignKey: 'ticketId', as: 'messages' });
};

module.exports = SupportTicket;
