const express = require('express');
const { auth } = require('../middleware/auth');
const Document = require('../models/Document');
const Event = require('../models/Event');
const User = require('../models/User');
const { notifyEvent } = require('../services/notify');

const router = express.Router();

// @route   GET /api/documents
// @desc    Get all documents
// @access  Public (mobile) / Admin panel
router.get('/', async (req, res) => {
  try {
    const { eventId, category, isPublic, requiresAuth } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = String(eventId);
    if (category) whereClause.category = category;
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';
    if (requiresAuth !== undefined) whereClause.requiresAuth = requiresAuth === 'true';
    whereClause.isActive = true;

    let documents;
    try {
      documents = await Document.findAll({
        where: whereClause,
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'name', 'description']
          },
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [['created_at', 'DESC']]
      });
    } catch (includeError) {
      console.warn('Documents include fallback:', includeError.message);
      documents = await Document.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });
    }

    res.json({
      success: true,
      documents: documents
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Public (mobile)
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Increment view count
    await document.increment('viewCount');

    res.json({
      success: true,
      document: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/documents
// @desc    Create new document
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { 
      title, 
      description, 
      fileName, 
      fileUrl, 
      fileType, 
      fileSize, 
      category, 
      version, 
      language, 
      isPublic, 
      requiresAuth, 
      eventId, 
      tags, 
      notes
    } = req.body;

    if (!title || !fileName || !fileUrl || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, dosya adı, dosya URL ve etkinlik alanları zorunludur'
      });
    }

    const documentData = {
      title,
      description: description || '',
      fileName,
      fileUrl,
      fileType: fileType || 'pdf',
      fileSize: fileSize || null,
      category: category || 'other',
      version: version || '1.0',
      language: language || 'tr',
      isPublic: isPublic !== undefined ? isPublic : true,
      requiresAuth: requiresAuth || false,
      eventId,
      uploadedBy: req.user.id,
      tags: tags || '',
      notes: notes || ''
    };

    const document = await Document.create(documentData);
    
    const createdDocument = await Document.findByPk(document.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    notifyEvent(eventId, {
      title: 'Yeni doküman',
      body: title,
      data: {
        type: 'document',
        screen: '/documents',
        documentId: document.id,
      },
      priority: 'default',
    }, { excludeUserId: req.user.id });

    res.status(201).json({
      success: true,
      document: createdDocument,
      message: 'Doküman başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      error: 'Doküman oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update document
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const updateData = req.body;
    await document.update(updateData);
    
    await document.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      document: document,
      message: 'Doküman başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      error: 'Doküman güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Delete document
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const document = await Document.findByPk(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    await document.destroy();

    res.json({
      success: true,
      message: 'Doküman başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;