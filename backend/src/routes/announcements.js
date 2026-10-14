const express = require('express');
const { auth } = require('../middleware/auth');
const { Announcement, Event, User } = require('../models');
const { notifyEventAndWait, preview } = require('../services/notify');

const announcementPushPayload = (announcement) => ({
  title: 'Yeni duyuru',
  body: preview(`${announcement.title}${announcement.content ? `: ${announcement.content}` : ''}`) || announcement.title,
  data: {
    type: 'announcement',
    screen: '/announcements',
    announcementId: announcement.id,
  },
  priority: announcement.priority === 'high' || announcement.priority === 'urgent' ? 'high' : 'default',
});

const sendAnnouncementPush = (announcement, options = {}) =>
  notifyEventAndWait(announcement.eventId, announcementPushPayload(announcement), options);

const router = express.Router();

// @route   GET /api/announcements
// @desc    Get all announcements
// @access  Private or Public (for mobile)
router.get('/', async (req, res) => {
  try {
    const { eventId, isPublished, priority, targetAudience } = req.query;
    
    let whereClause = {};
    
    // Sequelize with underscored:true automatically converts camelCase to snake_case
    if (eventId) whereClause.eventId = eventId;
    if (isPublished !== undefined) whereClause.isPublished = isPublished === 'true';
    if (priority) whereClause.priority = priority;
    if (targetAudience) whereClause.targetAudience = targetAudience;
    
    // Use simple findAll without associations for SQLite compatibility
    const announcements = await Announcement.findAll({
      where: whereClause,
      order: [['isPinned', 'DESC'], ['publishedAt', 'DESC'], ['createdAt', 'DESC']],
      raw: false // Keep as instances to access getters
    });

    // Fetch creator names separately to avoid association issues
    const creatorIds = [...new Set(announcements.map(a => a.createdBy).filter(Boolean))];
    const creators = creatorIds.length > 0 
      ? await User.findAll({ 
          where: { id: creatorIds },
          attributes: ['id', 'firstName', 'lastName', 'email'],
          raw: true 
        })
      : [];
    const creatorsMap = creators.reduce((acc, u) => { acc[u.id] = u; return acc; }, {});

    // Fetch event names separately
    const eventIds = [...new Set(announcements.map(a => a.eventId).filter(Boolean))];
    const events = eventIds.length > 0
      ? await Event.findAll({
          where: { id: eventIds },
          attributes: ['id', 'name', 'description'],
          raw: true
        })
      : [];
    const eventsMap = events.reduce((acc, e) => { acc[e.id] = e; return acc; }, {});

    // Map backend format to frontend format
    const mappedAnnouncements = announcements.map(ann => {
      const creatorId = ann.createdBy;
      const eventId = ann.eventId;
      const creator = creatorId ? creatorsMap[creatorId] : null;
      const event = eventId ? eventsMap[eventId] : null;
      
      // Handle attachments getter (JSON.parse)
      let attachmentsArray = [];
      try {
        const attachmentsValue = ann.attachments;
        if (Array.isArray(attachmentsValue)) {
          attachmentsArray = attachmentsValue;
        } else if (typeof attachmentsValue === 'string') {
          attachmentsArray = JSON.parse(attachmentsValue);
        }
      } catch (e) {
        console.warn('Error parsing attachments:', e);
      }
      
      return {
        id: ann.id,
        eventId: eventId || ann.eventId,
        title: ann.title,
        content: ann.content,
        type: ann.type,
        priority: (ann.priority === 'normal' ? 'medium' : ann.priority) || 'medium',
        status: ann.isPublished ? 'published' : 'draft',
        targetAudience: ann.targetAudience || 'all',
        publishedDate: ann.publishedAt ? new Date(ann.publishedAt).toISOString().split('T')[0] : undefined,
        authorId: creatorId,
        authorName: creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || 'Unknown' : 'Unknown',
        readCount: ann.readCount || 0,
        isPinned: ann.isPinned || false,
        attachments: attachmentsArray,
        createdAt: ann.createdAt ? new Date(ann.createdAt).toISOString().split('T')[0] : undefined,
        updatedAt: ann.updatedAt ? new Date(ann.updatedAt).toISOString().split('T')[0] : undefined,
        event: event || null
      };
    });

    res.json({
      success: true,
      announcements: mappedAnnouncements
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/announcements/:id
// @desc    Get announcement by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    let announcement;
    try {
      announcement = await Announcement.findByPk(req.params.id, {
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });
    } catch (includeError) {
      console.error('Include error, trying without associations:', includeError);
      announcement = await Announcement.findByPk(req.params.id);
    }

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    // Increment read count
    await announcement.increment('readCount');

    // Map backend format to frontend format
    const mappedAnnouncement = {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority === 'normal' ? 'medium' : announcement.priority,
      status: announcement.isPublished ? 'published' : 'draft',
      targetAudience: announcement.targetAudience,
      publishedDate: announcement.publishedAt ? new Date(announcement.publishedAt).toISOString().split('T')[0] : undefined,
      authorId: announcement.createdBy,
      authorName: announcement.creator ? `${announcement.creator.firstName} ${announcement.creator.lastName}` : 'Unknown',
      readCount: announcement.readCount || 0,
      isPinned: announcement.isPinned || false,
      attachments: announcement.attachments || [],
      createdAt: announcement.createdAt ? new Date(announcement.createdAt).toISOString().split('T')[0] : undefined,
      updatedAt: announcement.updatedAt ? new Date(announcement.updatedAt).toISOString().split('T')[0] : undefined,
      event: announcement.event || null
    };

    res.json({
      success: true,
      announcement: mappedAnnouncement
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/announcements
// @desc    Create new announcement
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
      title,
      content,
      priority,
      type,
      targetAudience,
      isPublished,
      status,
      publishedAt,
      isPinned,
      attachments
    } = req.body;

    if (!title || !content || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, içerik ve etkinlik alanları zorunludur'
      });
    }

    // Map frontend 'medium' priority to backend 'normal'
    const mappedPriority = priority === 'medium' ? 'normal' : (priority || 'normal');
    // Map frontend 'status' to backend 'isPublished'
    const mappedIsPublished = status === 'published' || isPublished || false;

    const announcementData = {
      eventId,
      title,
      content,
      priority: mappedPriority,
      type: type || 'info',
      targetAudience: targetAudience || 'all',
      isPublished: mappedIsPublished,
      publishedAt: mappedIsPublished && !publishedAt ? new Date() : publishedAt,
      isPinned: isPinned || false,
      createdBy: req.user.id,
      attachments: attachments || [],
      readCount: 0
    };

    const announcement = await Announcement.create(announcementData);
    
    let createdAnnouncement;
    try {
      createdAnnouncement = await Announcement.findByPk(announcement.id, {
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });
    } catch (includeError) {
      console.error('Include error, using basic data:', includeError);
      createdAnnouncement = announcement;
    }

    // Map backend format to frontend format for response
    const mappedAnnouncement = {
      id: createdAnnouncement.id,
      title: createdAnnouncement.title,
      content: createdAnnouncement.content,
      type: createdAnnouncement.type,
      priority: createdAnnouncement.priority === 'normal' ? 'medium' : createdAnnouncement.priority,
      status: createdAnnouncement.isPublished ? 'published' : 'draft',
      targetAudience: createdAnnouncement.targetAudience,
      publishedDate: createdAnnouncement.publishedAt ? new Date(createdAnnouncement.publishedAt).toISOString().split('T')[0] : undefined,
      authorId: createdAnnouncement.createdBy,
      authorName: createdAnnouncement.creator ? `${createdAnnouncement.creator.firstName} ${createdAnnouncement.creator.lastName}` : 'Unknown',
      readCount: createdAnnouncement.readCount || 0,
      isPinned: createdAnnouncement.isPinned || false,
      attachments: createdAnnouncement.attachments || [],
      createdAt: createdAnnouncement.createdAt ? new Date(createdAnnouncement.createdAt).toISOString().split('T')[0] : undefined,
      updatedAt: createdAnnouncement.updatedAt ? new Date(createdAnnouncement.updatedAt).toISOString().split('T')[0] : undefined,
      event: createdAnnouncement.event || null
    };

    let notifyResult = { sentCount: 0, okCount: 0, errorMessages: [] };
    if (mappedIsPublished) {
      notifyResult = await sendAnnouncementPush(announcement, { excludeUserId: req.user.id });
    }

    res.status(201).json({
      success: true,
      announcement: mappedAnnouncement,
      message: 'Duyuru başarıyla oluşturuldu',
      sentCount: notifyResult.sentCount,
      okCount: notifyResult.okCount
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Duyuru oluşturulurken bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    const wasPublished = !!announcement.isPublished;
    let updateData = { ...req.body };
    
    // Map frontend 'medium' priority to backend 'normal'
    if (updateData.priority === 'medium') {
      updateData.priority = 'normal';
    }
    
    // Map frontend 'status' to backend 'isPublished'
    if (updateData.status !== undefined) {
      updateData.isPublished = updateData.status === 'published';
      delete updateData.status; // Remove status as it doesn't exist in model
    }
    
    // If publishing for the first time, set publishedAt
    if (updateData.isPublished && !announcement.isPublished && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await announcement.update(updateData);
    
    let updatedAnnouncement;
    try {
      await announcement.reload({
        include: [
          {
            model: Event,
            as: 'event',
            attributes: ['id', 'name', 'description'],
            required: false
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });
      updatedAnnouncement = announcement;
    } catch (reloadError) {
      console.error('Reload error, using basic data:', reloadError);
      updatedAnnouncement = announcement;
    }

    // Map backend format to frontend format for response
    const mappedAnnouncement = {
      id: updatedAnnouncement.id,
      title: updatedAnnouncement.title,
      content: updatedAnnouncement.content,
      type: updatedAnnouncement.type,
      priority: updatedAnnouncement.priority === 'normal' ? 'medium' : updatedAnnouncement.priority,
      status: updatedAnnouncement.isPublished ? 'published' : 'draft',
      targetAudience: updatedAnnouncement.targetAudience,
      publishedDate: updatedAnnouncement.publishedAt ? new Date(updatedAnnouncement.publishedAt).toISOString().split('T')[0] : undefined,
      authorId: updatedAnnouncement.createdBy,
      authorName: updatedAnnouncement.creator ? `${updatedAnnouncement.creator.firstName} ${updatedAnnouncement.creator.lastName}` : 'Unknown',
      readCount: updatedAnnouncement.readCount || 0,
      isPinned: updatedAnnouncement.isPinned || false,
      attachments: updatedAnnouncement.attachments || [],
      createdAt: updatedAnnouncement.createdAt ? new Date(updatedAnnouncement.createdAt).toISOString().split('T')[0] : undefined,
      updatedAt: updatedAnnouncement.updatedAt ? new Date(updatedAnnouncement.updatedAt).toISOString().split('T')[0] : undefined,
      event: updatedAnnouncement.event || null
    };

    let notifyResult = { sentCount: 0, okCount: 0, errorMessages: [] };
    if (updatedAnnouncement.isPublished && !wasPublished) {
      notifyResult = await sendAnnouncementPush(updatedAnnouncement, { excludeUserId: req.user.id });
    }

    res.json({
      success: true,
      announcement: mappedAnnouncement,
      message: 'Duyuru başarıyla güncellendi',
      sentCount: notifyResult.sentCount,
      okCount: notifyResult.okCount
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Duyuru güncellenirken bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/announcements/:id/notify
// @desc    Send / resend push notification for an announcement
// @access  Private (Admin/Organizer)
router.post('/:id/notify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    if (!announcement.isPublished) {
      announcement.isPublished = true;
      if (!announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
      await announcement.save();
    }

    const notifyResult = await sendAnnouncementPush(announcement, { excludeUserId: req.user.id });

    res.json({
      success: true,
      sentCount: notifyResult.sentCount,
      okCount: notifyResult.okCount,
      errors: notifyResult.errorMessages,
      message: notifyResult.okCount > 0
        ? `Bildirim ${notifyResult.okCount} cihaza gönderildi`
        : 'Bu etkinlikte bildirim alacak kayıtlı cihaz yok. Katılımcı uygulamayı açıp bildirim iznini vermeli.'
    });
  } catch (error) {
    console.error('Notify announcement error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bildirim gönderilirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    await announcement.destroy();

    res.json({
      success: true,
      message: 'Duyuru başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
