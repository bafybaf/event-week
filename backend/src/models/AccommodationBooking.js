const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AccommodationBooking = sequelize.define('AccommodationBooking', {
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
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  guestName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guestEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  guestPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numberOfGuests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
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
  accommodationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'accommodations',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  }
}, {
  tableName: 'accommodation_bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
AccommodationBooking.associate = (models) => {
  // AccommodationBooking belongs to Accommodation
  AccommodationBooking.belongsTo(models.Accommodation, {
    foreignKey: 'accommodationId',
    as: 'accommodation'
  });
  
  // AccommodationBooking belongs to User
  AccommodationBooking.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // AccommodationBooking belongs to Event
  AccommodationBooking.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
};

module.exports = AccommodationBooking;

