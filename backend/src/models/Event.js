const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.STRING,
    defaultValue: () => require('uuid').v4(),
    primaryKey: true
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
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'active', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  registrationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isRegistrationOpen: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  organizerId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  settings: {
    type: DataTypes.TEXT,
    defaultValue: '{}',
    get() {
      const value = this.getDataValue('settings');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('settings', JSON.stringify(value));
    }
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  appLogo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  introVideoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  introVideoFileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'events',
  timestamps: true
});

// Define associations
Event.associate = function(models) {
  // Event belongs to organizer (User)
  Event.belongsTo(models.User, {
    foreignKey: 'organizerId',
    as: 'organizer'
  });
  
  // Event has many users
  Event.hasMany(models.User, {
    foreignKey: 'eventId',
    as: 'users'
  });
  
  // Event has many programs
  Event.hasMany(models.Program, {
    foreignKey: 'eventId',
    as: 'programs'
  });
  
  // Event has many speakers
  Event.hasMany(models.Speaker, {
    foreignKey: 'eventId',
    as: 'speakers'
  });
  
  // Event has many appointments
  Event.hasMany(models.Appointment, {
    foreignKey: 'eventId',
    as: 'appointments'
  });
  
  // Event has many transfers
  Event.hasMany(models.Transfer, {
    foreignKey: 'eventId',
    as: 'transfers'
  });
  
  // Event has many activities
  Event.hasMany(models.Activity, {
    foreignKey: 'eventId',
    as: 'activities'
  });
  
  // Event has many announcements
  Event.hasMany(models.Announcement, {
    foreignKey: 'eventId',
    as: 'announcements'
  });
};

Event.ensureIntroVideoColumns = async function () {
  try {
    const qi = sequelize.getQueryInterface();
    const desc = await qi.describeTable('events');
    if (!desc.intro_video_url) {
      await qi.addColumn('events', 'intro_video_url', { type: DataTypes.STRING, allowNull: true });
    }
    if (!desc.intro_video_file_name) {
      await qi.addColumn('events', 'intro_video_file_name', { type: DataTypes.STRING, allowNull: true });
    }
    if (!desc.logo) {
      await qi.addColumn('events', 'logo', { type: DataTypes.STRING, allowNull: true });
    }
    if (!desc.app_logo) {
      await qi.addColumn('events', 'app_logo', { type: DataTypes.STRING, allowNull: true });
    }
    await sequelize.query(`UPDATE events SET app_logo = logo WHERE logo IS NOT NULL AND logo != ''`);

    try {
      const [rows] = await sequelize.query(
        `SELECT value FROM settings WHERE key = 'app_intro_video' AND value IS NOT NULL AND value != '' LIMIT 1`
      );
      const url = rows && rows[0] && rows[0].value;
      if (url) {
        await sequelize.query(
          `UPDATE events SET intro_video_url = :url WHERE (intro_video_url IS NULL OR intro_video_url = '') AND LOWER(name) LIKE '%filli%'`,
          { replacements: { url } }
        );
      }
    } catch (seedError) {
      console.warn('Filli intro video seed:', seedError.message);
    }
  } catch (error) {
    console.warn('Intro video columns ensure:', error.message);
  }
};

module.exports = Event;