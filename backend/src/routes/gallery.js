const express = require('express');
const { auth } = require('../middleware/auth');
const Gallery = require('../models/Gallery');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/gallery
// @desc    Get all gallery items
// @access  Private (Admin/Organizer) or Public (for mobile)
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, category, isPublic, isFeatured } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (category) whereClause.category = category;
    if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';
    if (isFeatured !== undefined) whereClause.isFeatured = isFeatured === 'true';
    whereClause.isActive = true;
    
    const galleryItems = await Gallery.findAll({
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

    // uploadDate için createdAt'i kullan (frontend uyumluluğu için)
    const itemsWithUploadDate = galleryItems.map(item => {
      const itemData = item.toJSON ? item.toJSON() : item;
      itemData.uploadDate = itemData.createdAt || itemData.created_at;
      return itemData;
    });

    res.json({
      success: true,
      galleryItems: itemsWithUploadDate
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/gallery/:id
// @desc    Get gallery item by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const galleryItem = await Gallery.findByPk(req.params.id, {
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

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        error: 'Gallery item not found'
      });
    }

    // Increment view count
    await galleryItem.increment('viewCount');

    // uploadDate için createdAt'i kullan (frontend uyumluluğu için)
    const itemData = galleryItem.toJSON ? galleryItem.toJSON() : galleryItem;
    itemData.uploadDate = itemData.createdAt || itemData.created_at;

    res.json({
      success: true,
      galleryItem: itemData
    });
  } catch (error) {
    console.error('Get gallery item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/gallery
// @desc    Create new gallery item
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
      imageUrl, 
      thumbnailUrl, 
      category, 
      tags, 
      fileSize, 
      fileType, 
      dimensions, 
      photographer, 
      takenDate, 
      isPublic, 
      isFeatured, 
      eventId, 
      notes
    } = req.body;

    if (!title || !imageUrl || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, resim URL ve etkinlik alanları zorunludur'
      });
    }

    const galleryData = {
      title,
      description: description || '',
      imageUrl,
      thumbnailUrl: thumbnailUrl || '',
      category: category || 'event',
      tags: tags || '',
      fileSize: fileSize || null,
      fileType: fileType || '',
      dimensions: dimensions || '',
      photographer: photographer || '',
      takenDate: takenDate || null,
      isPublic: isPublic !== undefined ? isPublic : true,
      isFeatured: isFeatured || false,
      eventId,
      uploadedBy: req.user.id,
      notes: notes || ''
    };

    // uploadDate için createdAt kullanılacak (model'de uploadDate yok)

    const galleryItem = await Gallery.create(galleryData);
    
    const createdGalleryItem = await Gallery.findByPk(galleryItem.id, {
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

    // uploadDate için createdAt'i kullan (frontend uyumluluğu için)
    if (createdGalleryItem) {
      createdGalleryItem.uploadDate = createdGalleryItem.createdAt || createdGalleryItem.created_at;
    }

    res.status(201).json({
      success: true,
      galleryItem: createdGalleryItem,
      message: 'Galeri öğesi başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create gallery item error:', error);
    res.status(500).json({
      success: false,
      error: 'Galeri öğesi oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/gallery/:id
// @desc    Update gallery item
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const galleryItem = await Gallery.findByPk(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        error: 'Gallery item not found'
      });
    }

    const updateData = req.body;
    await galleryItem.update(updateData);
    
    await galleryItem.reload({
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

    // uploadDate için createdAt'i kullan (frontend uyumluluğu için)
    const itemData = galleryItem.toJSON ? galleryItem.toJSON() : galleryItem;
    itemData.uploadDate = itemData.createdAt || itemData.created_at;

    res.json({
      success: true,
      galleryItem: itemData,
      message: 'Galeri öğesi başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({
      success: false,
      error: 'Galeri öğesi güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Delete gallery item
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const galleryItem = await Gallery.findByPk(req.params.id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        error: 'Gallery item not found'
      });
    }

    await galleryItem.destroy();

    res.json({
      success: true,
      message: 'Galeri öğesi başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;