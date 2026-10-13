const express = require('express');
const { auth } = require('../middleware/auth');
const Accommodation = require('../models/Accommodation');
const Event = require('../models/Event');

const router = express.Router();

// @route   GET /api/accommodations
// @desc    Get all accommodations
// @access  Private (Admin/Organizer) or Public (for mobile)
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, type, isActive } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (type) whereClause.type = type;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const accommodations = await Accommodation.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['checkInDate', 'ASC']]
    });

    res.json({
      success: true,
      accommodations: accommodations
    });
  } catch (error) {
    console.error('Get accommodations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/accommodations/:id
// @desc    Get accommodation by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const accommodation = await Accommodation.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    res.json({
      success: true,
      accommodation: accommodation
    });
  } catch (error) {
    console.error('Get accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/accommodations
// @desc    Create new accommodation
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
      name, 
      type, 
      address, 
      city, 
      country, 
      phone, 
      email, 
      website, 
      checkInDate, 
      checkOutDate, 
      checkInTime, 
      checkOutTime, 
      roomType, 
      totalRooms, 
      availableRooms, 
      pricePerNight, 
      totalPrice, 
      currency, 
      amenities, 
      facilities, 
      policies, 
      cancellationPolicy, 
      images, 
      rating, 
      eventId, 
      notes
    } = req.body;

    if (!name || !type || !address || !city || !country || !checkInDate || !checkOutDate || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Ad, tip, adres, şehir, ülke, giriş tarihi, çıkış tarihi ve etkinlik alanları zorunludur'
      });
    }

    const accommodationData = {
      name,
      type,
      address,
      city,
      country,
      phone: phone || '',
      email: email || '',
      website: website || '',
      checkInDate,
      checkOutDate,
      checkInTime: checkInTime || '15:00:00',
      checkOutTime: checkOutTime || '11:00:00',
      roomType: roomType || 'double',
      totalRooms: totalRooms || 1,
      availableRooms: availableRooms || 1,
      pricePerNight: pricePerNight || 0.00,
      totalPrice: totalPrice || 0.00,
      currency: currency || 'TRY',
      amenities: amenities || '',
      facilities: facilities || '',
      policies: policies || '',
      cancellationPolicy: cancellationPolicy || '',
      images: images || '',
      rating: rating || null,
      eventId,
      notes: notes || ''
    };

    const accommodation = await Accommodation.create(accommodationData);
    
    const createdAccommodation = await Accommodation.findByPk(accommodation.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.status(201).json({
      success: true,
      accommodation: createdAccommodation,
      message: 'Konaklama başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Konaklama oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/accommodations/:id
// @desc    Update accommodation
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const accommodation = await Accommodation.findByPk(req.params.id);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    const updateData = req.body;
    await accommodation.update(updateData);
    
    await accommodation.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    res.json({
      success: true,
      accommodation: accommodation,
      message: 'Konaklama başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Konaklama güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/accommodations/:id
// @desc    Delete accommodation
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const accommodation = await Accommodation.findByPk(req.params.id);
    if (!accommodation) {
      return res.status(404).json({
        success: false,
        error: 'Accommodation not found'
      });
    }

    await accommodation.destroy();

    res.json({
      success: true,
      message: 'Konaklama başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete accommodation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;