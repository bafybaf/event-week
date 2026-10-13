const express = require('express');
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Event = require('../models/Event');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { notifyUser } = require('../services/notify');

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, requesterId, requestedUserId, status } = req.query;
    
    let whereClause = {};
    
    // Admin can see all, others only their own
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      whereClause[require('sequelize').Op.or] = [
        { requesterId: req.user.id },
        { requestedUserId: req.user.id }
      ];
    }
    
    if (eventId) whereClause.eventId = eventId;
    if (requesterId && (req.user.role === 'admin' || req.user.role === 'organizer')) {
      whereClause.requesterId = requesterId;
    }
    if (requestedUserId && (req.user.role === 'admin' || req.user.role === 'organizer')) {
      whereClause.requestedUserId = requestedUserId;
    }
    if (status) whereClause.status = status;
    
    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requesterId'
        },
        {
          model: User,
          as: 'requestedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requestedUserId'
        }
      ],
      order: [['appointmentDate', 'ASC']]
    });

    res.json({
      success: true,
      appointments: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requesterId'
        },
        {
          model: User,
          as: 'requestedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requestedUserId'
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' &&
        appointment.requesterId !== req.user.id && appointment.requestedUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      appointment: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      eventId,
      requesterId,
      requestedUserId,
      title,
      description,
      appointmentDate,
      duration,
      location,
      type,
      maxParticipants
    } = req.body;

    if (!eventId || !requestedUserId || !title || !appointmentDate) {
      return res.status(400).json({
        success: false,
        error: 'Etkinlik, hedef kullanıcı, başlık ve tarih alanları zorunludur'
      });
    }

    const appointmentData = {
      eventId,
      requesterId: requesterId || req.user.id, // Admin seçerse kullan, yoksa giriş yapmış kullanıcı
      requestedUserId,
      title,
      description: description || '',
      appointmentDate,
      duration: duration || 30,
      location: location || '',
      type: type || 'one_on_one',
      maxParticipants: maxParticipants || 2,
      currentParticipants: 1,
      status: 'pending'
    };

    const appointment = await Appointment.create(appointmentData);
    
    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requesterId'
        },
        {
          model: User,
          as: 'requestedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requestedUserId'
        }
      ]
    });

    // Send notification to the requested user
    try {
      const appointmentDateTime = new Date(appointmentDate);
      const formattedDate = appointmentDateTime.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const formattedTime = appointmentDateTime.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await notificationService.sendUserNotification(requestedUserId, {
        title: 'Yeni Randevu Oluşturuldu',
        body: `${title} - ${formattedDate} ${formattedTime}`,
        data: {
          type: 'appointment',
          screen: '/appointment-details',
          appointmentId: appointment.id,
          eventId: eventId
        },
        priority: 'high'
      });
      console.log(`Notification sent to user ${requestedUserId} for appointment ${appointment.id}`);
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the appointment creation if notification fails
    }

    res.status(201).json({
      success: true,
      appointment: createdAppointment,
      message: 'Randevu başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Randevu oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    const previousStatus = appointment.status;

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' &&
        appointment.requesterId !== req.user.id && appointment.requestedUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Only requested user or admin can change status
    if (req.body.status && 
        appointment.requestedUserId !== req.user.id && 
        req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Only the requested user can change appointment status'
      });
    }

    await appointment.update(req.body);
    
    await appointment.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requesterId'
        },
        {
          model: User,
          as: 'requestedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'requestedUserId'
        }
      ]
    });

    if (req.body.status && req.body.status !== previousStatus) {
      const statusLabels = {
        accepted: 'kabul edildi',
        confirmed: 'onaylandı',
        declined: 'reddedildi',
        rejected: 'reddedildi',
        cancelled: 'iptal edildi',
        completed: 'tamamlandı',
        pending: 'beklemede',
      };
      const statusText = statusLabels[appointment.status] || appointment.status;
      const targetUserId = String(req.user.id) === String(appointment.requestedUserId)
        ? appointment.requesterId
        : appointment.requestedUserId;

      notifyUser(targetUserId, {
        title: 'Randevu durumu',
        body: `${appointment.title} randevunuz ${statusText}.`,
        data: {
          type: 'appointment',
          screen: '/appointment-details',
          appointmentId: appointment.id,
          status: appointment.status,
        },
        priority: 'high',
      });
    }

    res.json({
      success: true,
      appointment: appointment,
      message: 'Randevu başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Randevu güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check access
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' &&
        appointment.requesterId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await appointment.destroy();

    res.json({
      success: true,
      message: 'Randevu başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
