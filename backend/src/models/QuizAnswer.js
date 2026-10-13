const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const QuizAnswer = sequelize.define('QuizAnswer', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  quizId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  questionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  selectedIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  elapsedMs: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'quiz_answers',
  timestamps: true
});

QuizAnswer.associate = (models) => {
  QuizAnswer.belongsTo(models.Quiz, { foreignKey: 'quizId', as: 'quiz' });
  QuizAnswer.belongsTo(models.QuizQuestion, { foreignKey: 'questionId', as: 'question' });
  QuizAnswer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = QuizAnswer;
