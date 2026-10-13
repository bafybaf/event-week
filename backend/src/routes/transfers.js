const express = require('express');
const { auth } = require('../middleware/auth');
const Transfer = require('../models/Transfer');
const Event = require('../models/Event');
const { notifyEvent } = require('../services/notify');

const router = express.Router();

// @route   GET /api/transfers
// @desc    Get all transfers
// @access  Private or Public (for mobile)
router.get('/', async (req, res) => {
  try {
    const { eventId, isActive, vehicleType } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (vehicleType) whereClause.vehicleType = vehicleType;
    
    const transfers = await Transfer.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['departureTime', 'ASC']]
    });

    res.json({
      success: true,
      transfers: transfers
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/transfers/:id
// @desc    Get transfer by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transfer = await Transfer.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    res.json({
      success: true,
      transfer: transfer
    });
  } catch (error) {
    console.error('Get transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/transfers
// @desc    Create new transfer
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
      eventId,
      name,
      description,
      departureLocation,
      arrivalLocation,
      departureTime,
      arrivalTime,
      vehicleType,
      capacity,
      price,
      currency,
      driverName,
      driverPhone,
      vehicleNumber,
      notes
    } = req.body;

    if (!eventId || !name || !departureLocation || !arrivalLocation || !departureTime || !arrivalTime) {
      return res.status(400).json({
        success: false,
        error: 'Etkinlik, ad, kalkış/varış lokasyonları ve zamanları zorunludur'
      });
    }

    const transferData = {
      eventId,
      name,
      description: description || '',
      departureLocation,
      arrivalLocation,
      departureTime,
      arrivalTime,
      vehicleType: vehicleType || 'bus',
      capacity: capacity || 50,
      currentBookings: 0,
      price: price || 0,
      currency: currency || 'TRY',
      driverName: driverName || '',
      driverPhone: driverPhone || '',
      vehicleNumber: vehicleNumber || '',
      notes: notes || '',
      isActive: true
    };

    const transfer = await Transfer.create(transferData);
    
    const createdTransfer = await Transfer.findByPk(transfer.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    notifyEvent(eventId, {
      title: 'Yeni transfer',
      body: `${name}: ${departureLocation} → ${arrivalLocation}`,
      data: {
        type: 'transfer',
        screen: '/transfers',
        transferId: transfer.id,
      },
      priority: 'default',
    }, { excludeUserId: req.user.id });

    res.status(201).json({
      success: true,
      transfer: createdTransfer,
      message: 'Transfer başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Transfer oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/transfers/:id
// @desc    Update transfer
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const transfer = await Transfer.findByPk(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    await transfer.update(req.body);
    
    await transfer.reload({
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
      transfer: transfer,
      message: 'Transfer başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Transfer güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/transfers/:id
// @desc    Delete transfer
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const transfer = await Transfer.findByPk(req.params.id);
    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Transfer not found'
      });
    }

    await transfer.destroy();

    res.json({
      success: true,
      message: 'Transfer başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
