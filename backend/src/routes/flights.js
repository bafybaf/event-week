const express = require('express');
const { auth } = require('../middleware/auth');
const Flight = require('../models/Flight');
const Event = require('../models/Event');
const { notifyEvent } = require('../services/notify');

const router = express.Router();

// @route   GET /api/flights
// @desc    Get all flights
// @access  Private (Admin/Organizer) or Public (for mobile)
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, status, isActive } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (status) whereClause.status = status;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const flights = await Flight.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['departureDate', 'ASC']]
    });

    res.json({
      success: true,
      flights: flights
    });
  } catch (error) {
    console.error('Get flights error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/flights/:id
// @desc    Get flight by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    res.json({
      success: true,
      flight: flight
    });
  } catch (error) {
    console.error('Get flight error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/flights
// @desc    Create new flight
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
      flightNumber, 
      airline, 
      departureAirport, 
      arrivalAirport, 
      departureDate, 
      arrivalDate, 
      departureTime, 
      arrivalTime, 
      duration,
      aircraft,
      terminal,
      gate,
      seatClass,
      price,
      baggageAllowance,
      mealService,
      wifiAvailable,
      entertainment,
      status,
      eventId,
      notes
    } = req.body;

    if (!flightNumber || !airline || !departureAirport || !arrivalAirport || !departureDate || !arrivalDate || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Uçuş numarası, havayolu, havaalanları, tarihler ve etkinlik alanları zorunludur'
      });
    }

    const flightData = {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      departureDate,
      arrivalDate,
      departureTime: departureTime || '00:00:00',
      arrivalTime: arrivalTime || '00:00:00',
      duration: duration || '',
      aircraft: aircraft || '',
      terminal: terminal || '',
      gate: gate || '',
      seatClass: seatClass || 'economy',
      price: price || 0.00,
      baggageAllowance: baggageAllowance || '',
      mealService: mealService || false,
      wifiAvailable: wifiAvailable || false,
      entertainment: entertainment || false,
      status: status || 'scheduled',
      eventId,
      notes: notes || ''
    };

    const flight = await Flight.create(flightData);
    
    const createdFlight = await Flight.findByPk(flight.id, {
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
      flight: createdFlight,
      message: 'Uçuş başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create flight error:', error);
    res.status(500).json({
      success: false,
      error: 'Uçuş oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/flights/:id
// @desc    Update flight
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const flight = await Flight.findByPk(req.params.id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    const previousStatus = flight.status;
    const previousGate = flight.gate;
    const previousTerminal = flight.terminal;

    const updateData = req.body;
    await flight.update(updateData);
    
    await flight.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    const statusChanged = flight.status !== previousStatus;
    const gateChanged = (updateData.gate !== undefined && flight.gate !== previousGate)
      || (updateData.terminal !== undefined && flight.terminal !== previousTerminal);

    if (statusChanged || gateChanged) {
      let title = 'Uçuş güncellemesi';
      let body = `${flight.flightNumber} uçuşunda güncelleme var.`;
      let updateType = 'update';

      if (flight.status === 'cancelled') {
        title = 'Uçuş iptali';
        body = `${flight.flightNumber} uçuşu iptal edildi.`;
        updateType = 'cancellation';
      } else if (flight.status === 'delayed') {
        title = 'Uçuş gecikmesi';
        body = `${flight.flightNumber} uçuşu gecikti.`;
        updateType = 'delay';
      } else if (flight.status === 'boarding') {
        title = 'Uçuş biniş';
        body = `${flight.flightNumber} uçuşu binişe başladı.`;
        updateType = 'boarding';
      } else if (gateChanged) {
        title = 'Kapı değişikliği';
        body = `${flight.flightNumber} uçuşunun kapısı: ${flight.gate || 'belirsiz'}`;
        updateType = 'gate_change';
      }

      notifyEvent(flight.eventId, {
        title,
        body,
        data: {
          type: 'flight',
          screen: '/flights',
          flightId: flight.id,
          updateType,
        },
        priority: 'high',
      }, { excludeUserId: req.user.id });
    }

    res.json({
      success: true,
      flight: flight,
      message: 'Uçuş başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update flight error:', error);
    res.status(500).json({
      success: false,
      error: 'Uçuş güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/flights/:id
// @desc    Delete flight
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const flight = await Flight.findByPk(req.params.id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        error: 'Flight not found'
      });
    }

    await flight.destroy();

    res.json({
      success: true,
      message: 'Uçuş başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete flight error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;