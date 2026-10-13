const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Program = sequelize.define('Program', {
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
      len: [2, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  room: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('session', 'break', 'meal', 'activity', 'presentation', 'workshop', 'networking'),
    defaultValue: 'session'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentAttendance: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isRegistrationRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVotingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  votingQuestion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  votingOptions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('votingOptions');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('votingOptions', JSON.stringify(value));
    }
  },
  votingType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'single'
  },
  materials: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('materials');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('materials', JSON.stringify(value));
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pdfUrl: {
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
  }
}, {
  tableName: 'programs',
  timestamps: true
});

// Define associations
Program.associate = function(models) {
  Program.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Many-to-many relationship with Speaker
  if (models.Speaker) {
    Program.belongsToMany(models.Speaker, {
      through: models.ProgramSpeaker || 'program_speakers',
      foreignKey: 'programId',
      otherKey: 'speakerId',
      as: 'speakers'
    });
  }
};

module.exports = Program;
