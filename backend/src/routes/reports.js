const express = require('express');
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private (Admin/Organizer)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { eventId, type, status, isActive } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const reports = await Report.findAll({
      where: whereClause,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      reports: reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private (Admin/Organizer)
router.get('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const report = await Report.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      report: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/reports
// @desc    Create new report
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
      type, 
      format, 
      status, 
      parameters, 
      filters, 
      data, 
      fileUrl, 
      fileSize, 
      generatedAt, 
      expiresAt, 
      isPublic, 
      isScheduled, 
      scheduleFrequency, 
      nextRunDate, 
      eventId, 
      notes
    } = req.body;

    if (!title || !type || !format || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, tip, format ve etkinlik alanları zorunludur'
      });
    }

    const reportData = {
      title,
      description: description || '',
      type,
      format,
      status: status || 'pending',
      parameters: parameters ? JSON.stringify(parameters) : null,
      filters: filters ? JSON.stringify(filters) : null,
      data: data ? JSON.stringify(data) : null,
      fileUrl: fileUrl || '',
      fileSize: fileSize || null,
      generatedAt: generatedAt || null,
      expiresAt: expiresAt || null,
      isPublic: isPublic || false,
      isScheduled: isScheduled || false,
      scheduleFrequency: scheduleFrequency || null,
      nextRunDate: nextRunDate || null,
      eventId,
      createdBy: req.user.id,
      notes: notes || ''
    };

    const report = await Report.create(reportData);
    
    const createdReport = await Report.findByPk(report.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      report: createdReport,
      message: 'Rapor başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    const updateData = req.body;
    
    // Handle JSON fields
    if (updateData.parameters) {
      updateData.parameters = JSON.stringify(updateData.parameters);
    }
    if (updateData.filters) {
      updateData.filters = JSON.stringify(updateData.filters);
    }
    if (updateData.data) {
      updateData.data = JSON.stringify(updateData.data);
    }
    
    await report.update(updateData);
    
    await report.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      report: report,
      message: 'Rapor başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      error: 'Rapor güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const report = await Report.findByPk(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    await report.destroy();

    res.json({
      success: true,
      message: 'Rapor başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
