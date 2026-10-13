const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Gallery = sequelize.define('Gallery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('event', 'speaker', 'venue', 'food', 'networking', 'award', 'other'),
    allowNull: false,
    defaultValue: 'event'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dimensions: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photographer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  takenDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  viewCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'galleries',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Gallery.associate = (models) => {
  // Gallery belongs to Event
  Gallery.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Gallery belongs to User (uploader)
  Gallery.belongsTo(models.User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
  });
};

module.exports = Gallery;

