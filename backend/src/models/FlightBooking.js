const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const FlightBooking = sequelize.define('FlightBooking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookingReference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  seatNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passengerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  passengerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  passengerPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'completed', 'no-show'),
    allowNull: false,
    defaultValue: 'confirmed'
  },
  bookingDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'TRY'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'flights',
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
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  }
}, {
  tableName: 'flight_bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
FlightBooking.associate = (models) => {
  // FlightBooking belongs to Flight
  FlightBooking.belongsTo(models.Flight, {
    foreignKey: 'flightId',
    as: 'flight'
  });
  
  // FlightBooking belongs to User
  FlightBooking.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // FlightBooking belongs to Event
  FlightBooking.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
};

module.exports = FlightBooking;

