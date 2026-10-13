const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array', 'object'),
    allowNull: false,
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.ENUM('general', 'appearance', 'notification', 'security', 'integration', 'feature', 'other'),
    allowNull: false,
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  defaultValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  options: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  group: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  eventId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Setting.associate = (models) => {
  // Setting belongs to Event (optional)
  Setting.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Setting belongs to User (updater)
  Setting.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
};

Setting.ensureAppLogo = async function () {
  try {
    await Setting.sync();
    let setting = await Setting.findOne({ where: { key: 'app_logo' } });
    if (!setting) {
      let seed = '';
      try {
        const [rows] = await sequelize.query(
          `SELECT app_logo, logo FROM events WHERE (app_logo IS NOT NULL AND app_logo != '') OR (logo IS NOT NULL AND logo != '') LIMIT 1`
        );
        const row = rows && rows[0];
        seed = (row && (row.app_logo || row.logo)) || '';
      } catch (seedError) {
        console.warn('App logo seed from events:', seedError.message);
      }
      await Setting.create({
        key: 'app_logo',
        value: seed || '',
        type: 'string',
        category: 'appearance',
        description: 'Uygulama logosu (telefonla giriş ekranı)',
        isPublic: true,
        isEditable: true,
        isRequired: false,
        eventId: null,
        group: 'branding',
        order: 0,
        isActive: true
      });
    }
  } catch (error) {
    console.warn('App logo setting ensure:', error.message);
  }
};

Setting.ensureAppIntroVideo = async function () {
  try {
    await Setting.sync();
    let setting = await Setting.findOne({ where: { key: 'app_intro_video' } });
    let nameSetting = await Setting.findOne({ where: { key: 'app_intro_video_file_name' } });
    if (!setting) {
      let seedUrl = '';
      let seedName = '';
      try {
        const [rows] = await sequelize.query(
          `SELECT intro_video_url, intro_video_file_name FROM events WHERE intro_video_url IS NOT NULL AND intro_video_url != '' LIMIT 1`
        );
        const row = rows && rows[0];
        seedUrl = (row && row.intro_video_url) || '';
        seedName = (row && row.intro_video_file_name) || '';
      } catch (seedError) {
        console.warn('App intro video seed from events:', seedError.message);
      }
      await Setting.create({
        key: 'app_intro_video',
        value: seedUrl || '',
        type: 'string',
        category: 'appearance',
        description: 'Uygulama giriş videosu',
        isPublic: true,
        isEditable: true,
        isRequired: false,
        eventId: null,
        group: 'branding',
        order: 1,
        isActive: true
      });
      if (!nameSetting) {
        await Setting.create({
          key: 'app_intro_video_file_name',
          value: seedName || '',
          type: 'string',
          category: 'appearance',
          description: 'Uygulama giriş videosu dosya adı',
          isPublic: true,
          isEditable: true,
          isRequired: false,
          eventId: null,
          group: 'branding',
          order: 2,
          isActive: true
        });
      }
    } else if (!nameSetting) {
      await Setting.create({
        key: 'app_intro_video_file_name',
        value: '',
        type: 'string',
        category: 'appearance',
        description: 'Uygulama giriş videosu dosya adı',
        isPublic: true,
        isEditable: true,
        isRequired: false,
        eventId: null,
        group: 'branding',
        order: 2,
        isActive: true
      });
    }
  } catch (error) {
    console.warn('App intro video setting ensure:', error.message);
  }
};

module.exports = Setting;

