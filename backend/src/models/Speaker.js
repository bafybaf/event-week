const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Speaker = sequelize.define('Speaker', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
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
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
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
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twitter: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expertise: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('expertise');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('expertise', JSON.stringify(value));
    }
  },
  languages: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('languages');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('languages', JSON.stringify(value));
    }
  },
  isKeynote: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'speakers',
  timestamps: true
});

// Define associations
Speaker.associate = function(models) {
  Speaker.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  Speaker.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user',
    required: false
  });
  
  // Many-to-many relationship with Program
  if (models.Program) {
    Speaker.belongsToMany(models.Program, {
      through: models.ProgramSpeaker || 'program_speakers',
      foreignKey: 'speakerId',
      otherKey: 'programId',
      as: 'programs'
    });
  }
};

module.exports = Speaker;
