const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const QuizQuestion = sequelize.define('QuizQuestion', {
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
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('options');
      try {
        return value ? JSON.parse(value) : [];
      } catch {
        return [];
      }
    },
    set(value) {
      this.setDataValue('options', JSON.stringify(value || []));
    }
  },
  correctIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20
  }
}, {
  tableName: 'quiz_questions',
  timestamps: true
});

QuizQuestion.associate = (models) => {
  QuizQuestion.belongsTo(models.Quiz, { foreignKey: 'quizId', as: 'quiz' });
  QuizQuestion.hasMany(models.QuizAnswer, { foreignKey: 'questionId', as: 'answers' });
};

module.exports = QuizQuestion;
