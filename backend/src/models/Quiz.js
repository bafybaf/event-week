const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Quiz = sequelize.define('Quiz', {
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
      len: [2, 160]
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft'
  },
  currentQuestionIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  questionStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  raffleWinnerId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rafflePool: {
    type: DataTypes.STRING,
    allowNull: true
  },
  raffleDrawnAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'quizzes',
  timestamps: true
});

Quiz.associate = (models) => {
  Quiz.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  Quiz.hasMany(models.QuizQuestion, { foreignKey: 'quizId', as: 'questions' });
  Quiz.hasMany(models.QuizPlayer, { foreignKey: 'quizId', as: 'players' });
  Quiz.hasMany(models.QuizAnswer, { foreignKey: 'quizId', as: 'answers' });
  Quiz.belongsTo(models.User, { foreignKey: 'raffleWinnerId', as: 'raffleWinner' });
};

module.exports = Quiz;
