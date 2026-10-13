const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/notifications/register-token
// @desc    Register push token for user
// @access  Private
router.post('/register-token', [
  auth,
  body('pushToken').notEmpty().withMessage('Push token is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { pushToken } = req.body;
    const userId = req.user.id;

    const success = await notificationService.updateUserPushToken(userId, pushToken);
    
    if (success) {
      res.json({
        success: true,
        message: 'Push token registered successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to register push token'
      });
    }
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/notifications/remove-token
// @desc    Remove push token for user
// @access  Private
router.delete('/remove-token', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const success = await notificationService.removeUserPushToken(userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Push token removed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to remove push token'
      });
    }
  } catch (error) {
    console.error('Remove token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send
// @desc    Send notification to user
// @access  Private (Admin/Organizer)
router.post('/send', [
  adminAuth,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userId, title, body, data, priority, badge } = req.body;

    const result = await notificationService.sendUserNotification(userId, {
      title,
      body,
      data,
      priority,
      badge
    });

    if (result) {
      res.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-bulk
// @desc    Send notification to multiple users
// @access  Private (Admin/Organizer)
router.post('/send-bulk', [
  adminAuth,
  body('userIds').isArray().withMessage('User IDs array is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userIds, title, body, data, priority, badge } = req.body;

    // Get push tokens for all users
    const users = await User.findAll({
      where: { 
        id: userIds,
        isActive: true 
      },
      attributes: ['pushToken']
    });

    const pushTokens = users
      .map(user => user.pushToken)
      .filter(token => token && token.trim() !== '');

    if (pushTokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid push tokens found'
      });
    }

    const result = await notificationService.sendBulkPushNotifications(pushTokens, {
      title,
      body,
      data,
      priority,
      badge
    });

    res.json({
      success: true,
      message: `Notification sent to ${result.length} devices`,
      sentCount: result.length
    });
  } catch (error) {
    console.error('Send bulk notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-role
// @desc    Send notification to users with specific role
// @access  Private (Admin/Organizer)
router.post('/send-role', [
  adminAuth,
  body('role').isIn(['participant', 'speaker', 'admin', 'organizer']).withMessage('Valid role is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { role, title, body, data, priority, badge } = req.body;

    const result = await notificationService.sendRoleNotification(role, {
      title,
      body,
      data,
      priority,
      badge
    });

    res.json({
      success: true,
      message: `Notification sent to ${result.length} ${role} users`,
      sentCount: result.length
    });
  } catch (error) {
    console.error('Send role notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/notifications/send-event
// @desc    Send notification to all event participants
// @access  Private (Admin/Organizer)
router.post('/send-event', [
  adminAuth,
  body('eventId').notEmpty().withMessage('Event ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('body').notEmpty().withMessage('Body is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { eventId, title, body, data, priority, badge } = req.body;

    const result = await notificationService.sendEventNotification(eventId, {
      title,
      body,
      data,
      priority,
      badge
    });

    res.json({
      success: true,
      message: `Event notification sent to ${result.length} participants`,
      sentCount: result.length
    });
  } catch (error) {
    console.error('Send event notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private (Admin/Organizer)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.count({
      where: { isActive: true }
    });

    const usersWithTokens = await User.count({
      where: { 
        isActive: true,
        pushToken: { [require('sequelize').Op.ne]: null }
      }
    });

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { isActive: true },
      group: ['role']
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        usersWithTokens,
        tokenCoverage: totalUsers > 0 ? Math.round((usersWithTokens / totalUsers) * 100) : 0,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.dataValues.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
