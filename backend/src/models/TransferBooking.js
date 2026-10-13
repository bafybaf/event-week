const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const TransferBooking = sequelize.define('TransferBooking', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  transferId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'transfers',
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
  },
  bookingDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  passengerCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
    defaultValue: 'pending'
  },
  specialRequests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pickupLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dropoffLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true
  },
  confirmationNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transfer_bookings',
  timestamps: true
});

module.exports = TransferBooking;
