const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Accommodation = sequelize.define('Accommodation', {
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
  type: {
    type: DataTypes.ENUM('hotel', 'resort', 'apartment', 'hostel', 'guesthouse', 'villa'),
    allowNull: false,
    defaultValue: 'hotel'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  checkInDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkOutDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  checkInTime: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '15:00:00'
  },
  checkOutTime: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '11:00:00'
  },
  roomType: {
    type: DataTypes.ENUM('single', 'double', 'twin', 'triple', 'quad', 'suite', 'family'),
    allowNull: false,
    defaultValue: 'double'
  },
  totalRooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  availableRooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  pricePerNight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
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
  amenities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  facilities: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  policies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancellationPolicy: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
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
  tableName: 'accommodations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Accommodation.associate = (models) => {
  // Accommodation belongs to Event
  Accommodation.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Accommodation has many AccommodationBookings
  Accommodation.hasMany(models.AccommodationBooking, {
    foreignKey: 'accommodationId',
    as: 'bookings'
  });
};

module.exports = Accommodation;

