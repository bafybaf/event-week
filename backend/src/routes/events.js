const express = require('express');
const { auth } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const { sequelize } = require('../database/connection');

const router = express.Router();

// @route   GET /api/events/public
// @desc    Get all active/published events (public for mobile app)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    console.log('[/api/events/public] Request received');
    
    // En basit yaklaşım: Raw query kullanarak tüm eventleri getir
    const [results] = await sequelize.query(`
      SELECT * FROM events 
      WHERE status IN ('published', 'active')
      ORDER BY created_at DESC
    `);

    console.log(`Found ${results.length} published/active events`);

    res.json({
      success: true,
      events: results
    });
  } catch (error) {
    console.error('❌ Get public events error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    
    // Fallback: Sequelize model ile dene
    try {
      console.log('Trying Sequelize model fallback...');
      const events = await Event.findAll({
        raw: true,
        order: [['created_at', 'DESC']]
      });
      
      const filtered = events.filter(e => 
        e.status === 'published' || e.status === 'active'
      );
      
      res.json({
        success: true,
        events: filtered
      });
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      res.status(500).json({
        success: false,
        error: error.message || 'Server error',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : undefined
      });
    }
  }
});

// @route   GET /api/events
// @desc    Get all events
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['created_at', 'DESC']]
    });

    // Her event için gerçek katılımcı sayısını hesapla
    const eventsWithParticipants = await Promise.all(
      events.map(async (event) => {
        try {
          // Sequelize model kullanarak katılımcı sayısını al
          const participantCount = await User.count({
            where: { eventId: event.id }
          });
          
          // Event'in currentParticipants değerini güncelle (sadece farklıysa)
          if (event.currentParticipants !== participantCount) {
            await event.update({ currentParticipants: participantCount });
          }
          
          const eventData = event.toJSON();
          eventData.currentParticipants = participantCount;
          
          return eventData;
        } catch (err) {
          console.error(`Error calculating participants for event ${event.id}:`, err);
          return event.toJSON();
        }
      })
    );

    res.json({
      success: true,
      events: eventsWithParticipants
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/events/:id/participants
// @desc    Get event participants list
// @access  Private (Admin/Organizer)
// NOTE: This route must come BEFORE /:id route to avoid route conflicts
router.get('/:id/participants', auth, async (req, res) => {
  try {
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get participants for this event
    const participants = await User.findAll({
      where: { eventId: event.id },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'role', 'company', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      participants: participants,
      count: participants.length
    });
  } catch (error) {
    console.error('Get event participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Gerçek katılımcı sayısını hesapla
    try {
      // Sequelize model kullanarak katılımcı sayısını al
      const participantCount = await User.count({
        where: { eventId: event.id }
      });
      
      // Event'in currentParticipants değerini güncelle (sadece farklıysa)
      if (event.currentParticipants !== participantCount) {
        await event.update({ currentParticipants: participantCount });
      }
      
      const eventData = event.toJSON();
      eventData.currentParticipants = participantCount;
      
      res.json({
        success: true,
        event: eventData
      });
    } catch (countError) {
      console.error('Error calculating participants:', countError);
      res.json({
        success: true,
        event: event
      });
    }
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
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
      startDate,
      endDate,
      location,
      address,
      city,
      country,
      status,
      maxParticipants,
      registrationDeadline,
      isRegistrationOpen,
      coverImage,
      logo,
      appLogo,
      introVideoUrl,
      introVideoFileName,
      website,
      contactEmail,
      contactPhone
    } = req.body;

    const event = await Event.create({
      name,
      description,
      startDate,
      endDate,
      location,
      address,
      city,
      country,
      maxParticipants,
      registrationDeadline,
      isRegistrationOpen: isRegistrationOpen !== undefined ? isRegistrationOpen : true,
      organizerId: req.user.id,
      coverImage,
      logo: logo || null,
      appLogo: appLogo || null,
      introVideoUrl: introVideoUrl || null,
      introVideoFileName: introVideoFileName || null,
      website,
      contactEmail,
      contactPhone,
      status: status || 'draft'
    });

    res.status(201).json({
      success: true,
      event: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private (Admin/Organizer or event organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user can update this event
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' && event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      location,
      address,
      city,
      country,
      status,
      maxParticipants,
      registrationDeadline,
      isRegistrationOpen,
      coverImage,
      logo,
      appLogo,
      introVideoUrl,
      introVideoFileName,
      website,
      contactEmail,
      contactPhone
    } = req.body;

    await event.update({
      name,
      description,
      startDate,
      endDate,
      location,
      address,
      city,
      country,
      status: (req.user.role === 'admin' || req.user.role === 'organizer') && status ? status : event.status,
      maxParticipants,
      registrationDeadline,
      isRegistrationOpen,
      coverImage,
      logo: logo !== undefined ? (logo || null) : event.logo,
      appLogo: appLogo !== undefined ? (appLogo || null) : event.appLogo,
      introVideoUrl: introVideoUrl !== undefined ? (introVideoUrl || null) : event.introVideoUrl,
      introVideoFileName: introVideoFileName !== undefined ? (introVideoFileName || null) : event.introVideoFileName,
      website,
      contactEmail,
      contactPhone
    });

    const updatedEvent = await Event.findByPk(req.params.id);
    res.json({
      success: true,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/events/:id/participants/import
// @desc    Import participants from Excel
// @access  Private (Admin/Organizer)
// NOTE: This route must come BEFORE /:id route to avoid route conflicts
router.post('/:id/participants/import', auth, async (req, res) => {
  try {
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const { participants } = req.body;
    
    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Participants array is required'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    // Excel'deki sıralamaya göre işle (tersten, böylece ilk satır en son oluşturulan olur)
    // Ama daha iyi: createdAt'i Excel'deki sıraya göre ayarla
    const baseDate = new Date();
    
    for (let i = 0; i < participants.length; i++) {
      const participantData = participants[i];
      const rowNumber = i + 1;
      
      try {
        // Gerekli alanları kontrol et
        if (!participantData.email || !participantData.firstName || !participantData.lastName) {
          results.errors.push({
            row: rowNumber,
            error: 'Email, Ad ve Soyad zorunludur'
          });
          continue;
        }

        // Email formatını kontrol et
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(participantData.email)) {
          results.errors.push({
            row: rowNumber,
            email: participantData.email,
            error: 'Geçersiz email formatı'
          });
          continue;
        }

        // Mevcut kullanıcıyı kontrol et
        const existingUser = await User.findOne({
          where: { email: participantData.email }
        });

        // Sıralama için createdAt'i ayarla (Excel'deki sıraya göre)
        // İlk satır en eski, son satır en yeni olacak
        const createdAtDate = new Date(baseDate.getTime() - (participants.length - i) * 1000);

        if (existingUser) {
          // Güncelle
          await existingUser.update({
            firstName: participantData.firstName,
            lastName: participantData.lastName,
            phoneNumber: participantData.phoneNumber || participantData.phone || existingUser.phoneNumber,
            company: participantData.company || existingUser.company,
            role: participantData.role || existingUser.role || 'participant',
            eventId: event.id,
            isActive: participantData.isActive !== undefined ? participantData.isActive : existingUser.isActive,
            createdAt: createdAtDate // Sıralamayı koru
          });
          results.updated++;
        } else {
          // Yeni oluştur
          await User.create({
            email: participantData.email,
            firstName: participantData.firstName,
            lastName: participantData.lastName,
            phoneNumber: participantData.phoneNumber || participantData.phone || null,
            company: participantData.company || null,
            role: participantData.role || 'participant',
            eventId: event.id,
            isActive: participantData.isActive !== undefined ? participantData.isActive : true,
            createdAt: createdAtDate // Sıralamayı koru
          });
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing participant row ${rowNumber}:`, error);
        results.errors.push({
          row: rowNumber,
          email: participantData.email || 'N/A',
          error: error.message || 'Bilinmeyen hata'
        });
      }
    }

    res.json({
      success: true,
      message: `${results.created} katılımcı oluşturuldu, ${results.updated} katılımcı güncellendi`,
      results: results
    });
  } catch (error) {
    console.error('Import participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private (Admin or event organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if user can delete this event
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
