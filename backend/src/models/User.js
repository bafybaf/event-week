const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [6, 255]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('participant', 'speaker', 'admin', 'organizer'),
    defaultValue: 'participant'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  pushToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const value = this.getDataValue('preferences');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('preferences', JSON.stringify(value));
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      console.log('🔄 beforeUpdate hook triggered');
      console.log('Changed fields:', user.changed());
      console.log('Password value:', user.password ? (user.password.startsWith('$2a$') ? '[HASHED]' : '[PLAIN]') : '[EMPTY]');
      
      // Password değişmişse ve hash'lenmemişse hash'le
      if (user.changed('password') || user.changed('password', true)) {
        if (user.password && !user.password.startsWith('$2a$')) {
          console.log('🔐 Hashing password');
          user.password = await bcrypt.hash(user.password, 12);
          console.log('✅ Password hashed successfully');
        } else if (user.password && user.password.startsWith('$2a$')) {
          console.log('⚠️ Password already hashed, skipping');
        }
      }
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  if (!password) {
    return false;
  }
  if (!this.password) {
    console.error('User has no password set');
    return false;
  }
  try {
  return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('bcrypt.compare error:', error);
    return false;
  }
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Define associations
User.associate = function(models) {
  // User belongs to an event
  User.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // User has many events as organizer
  User.hasMany(models.Event, {
    foreignKey: 'organizerId',
    as: 'organizedEvents'
  });
  
  // User has many appointments as requester
  User.hasMany(models.Appointment, {
    foreignKey: 'requesterId',
    as: 'requestedAppointments'
  });
  
  // User has many appointments as requested user
  User.hasMany(models.Appointment, {
    foreignKey: 'requestedUserId',
    as: 'receivedAppointments'
  });
  
  // User has many voting records
  User.hasMany(models.Voting, {
    foreignKey: 'userId',
    as: 'votes'
  });
  
  // User has many transfer bookings
  User.hasMany(models.TransferBooking, {
    foreignKey: 'userId',
    as: 'transferBookings'
  });
  
  // User has many activity registrations
  User.hasMany(models.ActivityRegistration, {
    foreignKey: 'userId',
    as: 'activityRegistrations'
  });
  
  // User can be a speaker
  User.hasMany(models.Speaker, {
    foreignKey: 'userId',
    as: 'speakerProfiles'
  });
};

// Note: Password hashing hooks are already defined in the model definition above
// Note: validatePassword instance method is already defined above
// No need to redefine them here

module.exports = User;
