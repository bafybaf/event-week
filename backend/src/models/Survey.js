const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Survey = sequelize.define('Survey', {
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
    type: DataTypes.ENUM('feedback', 'evaluation', 'satisfaction', 'quiz', 'poll', 'registration', 'other'),
    allowNull: false,
    defaultValue: 'feedback'
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'closed', 'archived'),
    allowNull: false,
    defaultValue: 'draft'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  allowMultipleSubmissions: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  showResults: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requireLogin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  maxResponses: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentResponses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  questions: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  settings: {
    type: DataTypes.TEXT,
    allowNull: true
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
  createdBy: {
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'surveys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Survey.associate = (models) => {
  // Survey belongs to Event
  Survey.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Survey belongs to User (creator)
  Survey.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  
  // Survey belongs to Program (session)
  Survey.belongsTo(models.Program, {
    foreignKey: 'sessionId',
    as: 'session'
  });
  
  // Survey has many SurveyResponses
  Survey.hasMany(models.SurveyResponse, {
    foreignKey: 'surveyId',
    as: 'responses'
  });
};

module.exports = Survey;

