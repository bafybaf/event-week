const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ProgramSpeaker = sequelize.define('ProgramSpeaker', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  programId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'program_id', // Explicit field name mapping for SQLite underscored
    references: {
      model: 'programs',
      key: 'id'
    }
  },
  speakerId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'speaker_id', // Explicit field name mapping for SQLite underscored
    references: {
      model: 'speakers',
      key: 'id'
    }
  }
}, {
  tableName: 'program_speakers',
  timestamps: true,
  underscored: true, // Explicitly set underscored for consistency
  indexes: [
    {
      unique: true,
      fields: ['program_id', 'speaker_id'] // Use snake_case for index fields
    }
  ]
});

// Define associations
ProgramSpeaker.associate = function(models) {
  ProgramSpeaker.belongsTo(models.Speaker, {
    foreignKey: 'speakerId',
    as: 'Speaker'
  });
  ProgramSpeaker.belongsTo(models.Program, {
    foreignKey: 'programId',
    as: 'Program'
  });
};

module.exports = ProgramSpeaker;

