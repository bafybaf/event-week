const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const FeedLike = sequelize.define('FeedLike', {
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
  }
}, {
  tableName: 'feed_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['feed_item_id', 'user_id']
    }
  ]
});

FeedLike.associate = (models) => {
  FeedLike.belongsTo(models.FeedItem, { foreignKey: 'feedItemId', as: 'item' });
  FeedLike.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = FeedLike;
