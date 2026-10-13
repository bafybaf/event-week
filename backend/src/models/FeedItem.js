const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const FeedItem = sequelize.define('FeedItem', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authorId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kind: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'post',
    validate: {
      isIn: [['post', 'story']]
    }
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mediaUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mediaType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'image',
    validate: {
      isIn: [['image', 'video']]
    }
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'feed_items',
  timestamps: true
});

FeedItem.associate = (models) => {
  FeedItem.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  FeedItem.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
  FeedItem.hasMany(models.FeedLike, { foreignKey: 'feedItemId', as: 'likes' });
  FeedItem.hasMany(models.FeedComment, { foreignKey: 'feedItemId', as: 'comments' });
};

module.exports = FeedItem;
