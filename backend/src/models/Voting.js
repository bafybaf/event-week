const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Voting = sequelize.define('Voting', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  programId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'programs',
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  selectedOption: {
    type: DataTypes.STRING,
    allowNull: true
  },
  selectedOptions: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('selectedOptions');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('selectedOptions', JSON.stringify(value));
    }
  },
  textResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  submittedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'votings',
  timestamps: true
});

// Define associations
Voting.associate = function(models) {
  Voting.belongsTo(models.Program, {
    foreignKey: 'programId',
    as: 'program'
  });
  Voting.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = Voting;
