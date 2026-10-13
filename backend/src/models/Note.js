const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Note = sequelize.define('Note', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('personal', 'meeting', 'session', 'idea', 'reminder', 'todo', 'other'),
    allowNull: false,
    defaultValue: 'personal'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  reminderDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  viewCount: {
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
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'programs',
      key: 'id'
    }
  },
  attachments: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Note.associate = (models) => {
  // Note belongs to Event
  Note.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Note belongs to User
  Note.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Note belongs to Program (session)
  Note.belongsTo(models.Program, {
    foreignKey: 'sessionId',
    as: 'session'
  });
};

module.exports = Note;

