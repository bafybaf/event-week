const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  fileType: {
    type: DataTypes.ENUM('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'image', 'video', 'other'),
    allowNull: false,
    defaultValue: 'pdf'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('agenda', 'presentation', 'handout', 'certificate', 'manual', 'guide', 'form', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  version: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '1.0'
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'tr'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  requiresAuth: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  viewCount: {
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
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    }
  },
  uploadedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Associations
Document.associate = (models) => {
  // Document belongs to Event
  Document.belongsTo(models.Event, {
    foreignKey: 'eventId',
    as: 'event'
  });
  
  // Document belongs to User (uploader)
  Document.belongsTo(models.User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
  });
};

module.exports = Document;

