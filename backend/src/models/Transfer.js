const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Transfer = sequelize.define('Transfer', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  departureLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  arrivalLocation: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departureTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  arrivalTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  vehicleType: {
    type: DataTypes.ENUM('bus', 'car', 'van', 'minibus', 'shuttle'),
    defaultValue: 'bus'
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  currentBookings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'TRY'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPattern: {
    type: DataTypes.STRING,
    allowNull: true
  },
  driverName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  driverPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transfers',
  timestamps: true
});

// Define associations
Transfer.associate = function(models) {
  Transfer.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
};

module.exports = Transfer;
