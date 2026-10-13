const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const FeedComment = sequelize.define('FeedComment', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  feedItemId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'feed_comments',
  timestamps: true
});

FeedComment.associate = (models) => {
  FeedComment.belongsTo(models.FeedItem, { foreignKey: 'feedItemId', as: 'item' });
  FeedComment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = FeedComment;
