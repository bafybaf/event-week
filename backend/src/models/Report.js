const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Report = sequelize.define('Report', {
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
  type: {
    type: DataTypes.ENUM('attendance', 'feedback', 'financial', 'performance', 'summary', 'analytics', 'export', 'other'),
    allowNull: false,
    defaultValue: 'summary'
  },
  format: {
    type: DataTypes.ENUM('pdf', 'excel', 'csv', 'json', 'html'),
    allowNull: false,
    defaultValue: 'pdf'
  },
  status: {
    type: DataTypes.ENUM('pending', 'generating', 'completed', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  parameters: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  filters: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  generatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isScheduled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  scheduleFrequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
    allowNull: true
  },
  nextRunDate: {
    type: DataTypes.DATE,
    allowNull: true
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
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Report.associate = (models) => {
  // Report belongs to Event
  Report.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Report belongs to User (creator)
  Report.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
};

module.exports = Report;

