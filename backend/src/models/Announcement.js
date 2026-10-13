const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Announcement = sequelize.define('Announcement', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  type: {
    type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
    defaultValue: 'info'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  targetAudience: {
    type: DataTypes.ENUM('all', 'speakers', 'participants', 'organizers'),
    defaultValue: 'all'
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('attachments');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('attachments', JSON.stringify(value));
    }
  }
}, {
  tableName: 'announcements',
  timestamps: true
});

// Define associations
Announcement.associate = function(models) {
  Announcement.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  Announcement.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

module.exports = Announcement;

