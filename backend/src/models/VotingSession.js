const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const VotingSession = sequelize.define('VotingSession', {
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
  programId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'programs',
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('options');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value));
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('single', 'multiple'),
    defaultValue: 'single'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowAnonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'voting_sessions',
  timestamps: true
});

// Define associations
VotingSession.associate = function(models) {
  VotingSession.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  VotingSession.belongsTo(models.Program, {
    foreignKey: 'programId',
    as: 'program',
    required: false
  });
};

module.exports = VotingSession;

