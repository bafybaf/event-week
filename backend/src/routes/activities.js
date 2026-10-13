const express = require('express');
const { auth } = require('../middleware/auth');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const User = require('../models/User');
const { notifyEvent } = require('../services/notify');

const router = express.Router();

// @route   GET /api/activities
// @desc    Get all activities
// @access  Private (Admin/Organizer) or Public (for mobile)
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, type, isActive } = req.query;
    
    let whereClause = {};
    
    // Filter by event if specified
    if (eventId) {
      whereClause.eventId = eventId;
    }
    
    // Filter by type if specified
    if (type) {
      whereClause.type = type;
    }
    
    // Filter by active status if specified
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    const activities = await Activity.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['startDate', 'ASC']]
    });

    res.json({
      success: true,
      activities: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get activity by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      activity: activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/activities
// @desc    Create new activity
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Create activity request:', req.body);
    
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { 
      name, 
      description, 
      type, 
      startDate, 
      endDate, 
      location, 
      capacity, 
      price, 
      requiresRegistration,
      eventId,
      organizerId,
      imageUrl,
      requirements,
      equipment,
      notes
    } = req.body;

    // Validation
    if (!name || !startDate || !endDate || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Ad, başlangıç tarihi, bitiş tarihi ve etkinlik alanları zorunludur'
      });
    }

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(400).json({
        success: false,
        error: 'Etkinlik bulunamadı'
      });
    }

    // Create activity
    const activityData = {
      name,
      description: description || '',
      type: type || 'other',
      startDate,
      endDate,
      location: location || '',
      capacity: capacity || null,
      price: price || 0.00,
      requiresRegistration: requiresRegistration || false,
      eventId,
      organizerId: organizerId || req.user.id,
      imageUrl: imageUrl || '',
      requirements: requirements || '',
      equipment: equipment || '',
      notes: notes || ''
    };

    console.log('🎯 Creating activity with data:', activityData);

    const activity = await Activity.create(activityData);
    
    // Load with associations
    const createdActivity = await Activity.findByPk(activity.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    console.log('✅ Activity created successfully:', createdActivity);

    notifyEvent(eventId, {
      title: 'Yeni aktivite',
      body: name,
      data: {
        type: 'activity',
        screen: '/activities',
        activityId: activity.id,
      },
      priority: 'default',
    }, { excludeUserId: req.user.id });

    res.status(201).json({
      success: true,
      activity: createdActivity,
      message: 'Aktivite başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('❌ Create activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Aktivite oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update activity
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('📝 Update activity request:', req.params.id, req.body);
    
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    const {
      name,
      description,
      type,
      startDate,
      endDate,
      location,
      capacity,
      price,
      requiresRegistration,
      isActive,
      organizerId,
      imageUrl,
      requirements,
      equipment,
      notes
    } = req.body;

    // Update activity
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (location !== undefined) updateData.location = location;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (price !== undefined) updateData.price = price;
    if (requiresRegistration !== undefined) updateData.requiresRegistration = requiresRegistration;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (organizerId !== undefined) updateData.organizerId = organizerId;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (equipment !== undefined) updateData.equipment = equipment;
    if (notes !== undefined) updateData.notes = notes;

    console.log('🔧 Updating activity with data:', updateData);

    await activity.update(updateData);
    
    // Reload with associations
    await activity.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    console.log('✅ Activity updated successfully:', activity);

    res.json({
      success: true,
      activity: activity,
      message: 'Aktivite başarıyla güncellendi'
    });
  } catch (error) {
    console.error('❌ Update activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Aktivite güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete activity
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    await activity.destroy();

    res.json({
      success: true,
      message: 'Aktivite başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;