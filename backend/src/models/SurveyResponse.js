const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const SurveyResponse = sequelize.define('SurveyResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  responses: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  surveyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'surveys',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  }
}, {
  tableName: 'survey_responses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
SurveyResponse.associate = (models) => {
  // SurveyResponse belongs to Survey
  SurveyResponse.belongsTo(models.Survey, {
    foreignKey: 'surveyId',
    as: 'survey'
  });
  
  // SurveyResponse belongs to User (optional for anonymous responses)
  SurveyResponse.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // SurveyResponse belongs to Event
  SurveyResponse.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
};

module.exports = SurveyResponse;

