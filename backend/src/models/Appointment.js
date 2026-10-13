const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requestedUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30, // minutes
    validate: {
      min: 15,
      max: 480
    }
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('one_on_one', 'group', 'networking', 'mentoring', 'business'),
    defaultValue: 'one_on_one'
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 2
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reminderSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback: {
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
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

// Define associations
Appointment.associate = function(models) {
  Appointment.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  Appointment.belongsTo(models.User, {
    foreignKey: 'requesterId',
    as: 'requester'
  });
  Appointment.belongsTo(models.User, {
    foreignKey: 'requestedUserId',
    as: 'requestedUser'
  });
};

module.exports = Appointment;
