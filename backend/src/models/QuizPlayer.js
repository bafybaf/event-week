const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const QuizPlayer = sequelize.define('QuizPlayer', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  quizId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'quizzes',
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
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'quiz_players',
  timestamps: true
});

QuizPlayer.associate = (models) => {
  QuizPlayer.belongsTo(models.Quiz, { foreignKey: 'quizId', as: 'quiz' });
  QuizPlayer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = QuizPlayer;
