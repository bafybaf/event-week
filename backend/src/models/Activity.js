const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
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
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'other',
    validate: {
      isIn: [['workshop', 'seminar', 'conference', 'panel', 'networking', 'social', 'dinner', 'lunch', 'breakfast', 'coffee', 'sports', 'fitness', 'yoga', 'cultural', 'tour', 'museum', 'concert', 'theater', 'exhibition', 'training', 'team-building', 'competition', 'award', 'opening', 'closing', 'gala', 'cocktail', 'entertainment', 'game', 'quiz', 'photography', 'art', 'music', 'dance', 'cooking', 'wine-tasting', 'technology', 'innovation', 'startup', 'investment', 'business', 'other']]
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  registeredCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requiresRegistration: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  organizerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  equipment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Activity.associate = (models) => {
  // Activity belongs to Event
  Activity.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Activity belongs to User (organizer)
  Activity.belongsTo(models.User, {
    foreignKey: 'organizerId',
    as: 'organizer'
  });
  
  // Activity has many ActivityRegistrations
  Activity.hasMany(models.ActivityRegistration, {
    foreignKey: 'activityId',
    as: 'registrations'
  });
};

module.exports = Activity;