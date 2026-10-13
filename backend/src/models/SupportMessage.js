const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SupportMessage = sequelize.define('SupportMessage', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  ticketId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'support_messages',
  timestamps: true
});

SupportMessage.associate = (models) => {
  SupportMessage.belongsTo(models.SupportTicket, { foreignKey: 'ticketId', as: 'ticket' });
  SupportMessage.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender' });
};

module.exports = SupportMessage;
