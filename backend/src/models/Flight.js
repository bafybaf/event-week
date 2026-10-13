const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  flightNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  departureAirport: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  arrivalAirport: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  departureDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  arrivalDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  departureTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  arrivalTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aircraft: {
    type: DataTypes.STRING,
    allowNull: true
  },
  terminal: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  seatClass: {
    type: DataTypes.ENUM('economy', 'business', 'first'),
    allowNull: false,
    defaultValue: 'economy'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  baggageAllowance: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mealService: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  wifiAvailable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  entertainment: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'flights',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Flight.associate = (models) => {
  // Flight belongs to Event
  Flight.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Flight has many FlightBookings
  Flight.hasMany(models.FlightBooking, {
    foreignKey: 'flightId',
    as: 'bookings'
  });
};

module.exports = Flight;

