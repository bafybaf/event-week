const express = require('express');
const { auth } = require('../middleware/auth');
const { SupportTicket, SupportMessage, User, Event } = require('../models');
const { isStaff, resolveEventScope } = require('../services/feedService');
const {
  canViewTicket,
  canReplyToTicket,
  canChangeTicketStatus,
  validateTicketCreate,
  normalizeAttachments,
  parseAttachments
} = require('../services/supportService');
const { notifyStaff, notifyUser, preview } = require('../services/notify');

const router = express.Router();
const userAttrs = ['id', 'firstName', 'lastName', 'profileImage', 'role'];

const loadUsersMap = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
  if (!uniqueIds.length) return {};
  const users = await User.findAll({ where: { id: uniqueIds }, attributes: userAttrs });
  return users.reduce((acc, user) => {
    acc[String(user.id)] = user.toJSON();
    return acc;
  }, {});
};

const serializeMessage = (message, sender) => {
  const data = message.toJSON ? message.toJSON() : { ...message };
  return {
    ...data,
    attachments: parseAttachments(data.attachments),
    sender: sender || null
  };
};

const serializeTicket = (ticket, extras = {}) => {
  const data = ticket.toJSON ? ticket.toJSON() : { ...ticket };
  return {
    ...data,
    user: extras.user || null,
    event: extras.event || null,
    lastMessage: extras.lastMessage || null,
    messageCount: extras.messageCount || 0
  };
};

const addMessage = async (ticket, user, { body, attachments }) => {
  const files = normalizeAttachments(attachments);
  const text = String(body || '').trim();
  if (!text && files.length === 0) {
    throw new Error('Mesaj veya ek gerekli');
  }
  const message = await SupportMessage.create({
    ticketId: ticket.id,
    senderId: user.id,
    body: text,
    attachments: JSON.stringify(files)
  });
  await ticket.update({ lastMessageAt: new Date() });
  return message;
};

router.get('/tickets', auth, async (req, res) => {
  try {
    const scope = resolveEventScope(req.user, req.query.eventId);
    if (scope.error) {
      return res.status(400).json({ success: false, error: scope.error });
    }

    const where = {};
    if (scope.eventId) where.eventId = scope.eventId;
    if (!isStaff(req.user)) where.userId = req.user.id;
    if (req.query.status) where.status = req.query.status;

    const tickets = await SupportTicket.findAll({
      where,
      order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']]
    });

    const ticketIds = tickets.map((ticket) => ticket.id);
    const messages = ticketIds.length
      ? await SupportMessage.findAll({
          where: { ticketId: ticketIds },
          order: [['createdAt', 'DESC']]
        })
      : [];

    const eventIds = [...new Set(tickets.map((ticket) => ticket.eventId).filter(Boolean))];
    const [usersMap, events] = await Promise.all([
      loadUsersMap([
        ...tickets.map((ticket) => ticket.userId),
        ...messages.map((message) => message.senderId)
      ]),
      eventIds.length
        ? Event.findAll({ where: { id: eventIds }, attributes: ['id', 'name'] })
        : Promise.resolve([])
    ]);
    const eventsMap = events.reduce((acc, event) => {
      acc[String(event.id)] = event.toJSON();
      return acc;
    }, {});

    const lastByTicket = {};
    const countByTicket = {};
    messages.forEach((message) => {
      const key = String(message.ticketId);
      countByTicket[key] = (countByTicket[key] || 0) + 1;
      if (!lastByTicket[key]) lastByTicket[key] = message;
    });

    res.json({
      success: true,
      tickets: tickets.map((ticket) => serializeTicket(ticket, {
        user: usersMap[String(ticket.userId)] || null,
        event: eventsMap[String(ticket.eventId)] || null,
        lastMessage: lastByTicket[String(ticket.id)]
          ? serializeMessage(lastByTicket[String(ticket.id)], usersMap[String(lastByTicket[String(ticket.id)].senderId)])
          : null,
        messageCount: countByTicket[String(ticket.id)] || 0
      }))
    });
  } catch (error) {
    console.error('List support tickets error:', error);
    res.status(500).json({ success: false, error: 'Talepler yüklenemedi' });
  }
});

router.post('/tickets', auth, async (req, res) => {
  try {
    const scope = resolveEventScope(req.user, req.body.eventId);
    if (scope.error) {
      return res.status(400).json({ success: false, error: scope.error });
    }
    if (!scope.eventId) {
      return res.status(400).json({ success: false, error: 'Etkinlik gerekli' });
    }

    const payload = {
      subject: req.body.subject,
      eventId: scope.eventId,
      body: req.body.body,
      attachments: req.body.attachments
    };
    const validation = validateTicketCreate(payload);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const ticket = await SupportTicket.create({
      eventId: scope.eventId,
      userId: req.user.id,
      subject: String(req.body.subject).trim(),
      status: 'open',
      lastMessageAt: new Date()
    });
    const message = await addMessage(ticket, req.user, payload);
    const usersMap = await loadUsersMap([req.user.id]);

    notifyStaff(scope.eventId, {
      title: 'Yeni destek talebi',
      body: preview(ticket.subject) || 'Yeni bir destek talebi açıldı.',
      data: {
        type: 'support',
        screen: '/support-detail',
        ticketId: ticket.id,
      },
      priority: 'high',
    }, { excludeUserId: req.user.id });

    res.status(201).json({
      success: true,
      ticket: serializeTicket(ticket, {
        user: usersMap[String(req.user.id)] || null,
        lastMessage: serializeMessage(message, usersMap[String(req.user.id)]),
        messageCount: 1
      })
    });
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ success: false, error: error.message || 'Talep açılamadı' });
  }
});

router.get('/tickets/:id', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Talep bulunamadı' });
    }
    if (!canViewTicket(req.user, ticket)) {
      return res.status(403).json({ success: false, error: 'Bu talebi göremezsiniz' });
    }

    const messages = await SupportMessage.findAll({
      where: { ticketId: ticket.id },
      order: [['createdAt', 'ASC']]
    });
    const usersMap = await loadUsersMap([
      ticket.userId,
      ...messages.map((message) => message.senderId)
    ]);
    const event = await Event.findByPk(ticket.eventId, { attributes: ['id', 'name'] });

    res.json({
      success: true,
      ticket: serializeTicket(ticket, {
        user: usersMap[String(ticket.userId)] || null,
        event: event ? event.toJSON() : null,
        messageCount: messages.length
      }),
      messages: messages.map((message) =>
        serializeMessage(message, usersMap[String(message.senderId)] || null)
      )
    });
  } catch (error) {
    console.error('Get support ticket error:', error);
    res.status(500).json({ success: false, error: 'Talep yüklenemedi' });
  }
});

router.post('/tickets/:id/messages', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Talep bulunamadı' });
    }
    if (!canReplyToTicket(req.user, ticket)) {
      return res.status(403).json({
        success: false,
        error: ticket.status === 'closed' ? 'Kapalı talebe yanıt yazılamaz' : 'Yanıt yazamazsınız'
      });
    }

    const message = await addMessage(ticket, req.user, req.body);
    const usersMap = await loadUsersMap([req.user.id]);

    const snippet = preview(req.body.body) || 'Yeni bir mesajınız var.';
    if (isStaff(req.user) && String(ticket.userId) !== String(req.user.id)) {
      notifyUser(ticket.userId, {
        title: 'Destek yanıtı',
        body: snippet,
        data: {
          type: 'support',
          screen: '/support-detail',
          ticketId: ticket.id,
        },
        priority: 'high',
      });
    } else if (!isStaff(req.user)) {
      notifyStaff(ticket.eventId, {
        title: 'Destek mesajı',
        body: snippet,
        data: {
          type: 'support',
          screen: '/support-detail',
          ticketId: ticket.id,
        },
        priority: 'high',
      }, { excludeUserId: req.user.id });
    }

    res.status(201).json({
      success: true,
      message: serializeMessage(message, usersMap[String(req.user.id)] || null)
    });
  } catch (error) {
    console.error('Create support message error:', error);
    res.status(400).json({ success: false, error: error.message || 'Mesaj gönderilemedi' });
  }
});

router.put('/tickets/:id/status', auth, async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Talep bulunamadı' });
    }
    if (!canChangeTicketStatus(req.user, ticket)) {
      return res.status(403).json({ success: false, error: 'Durumu değiştiremezsiniz' });
    }

    const status = req.body.status === 'closed' ? 'closed' : 'open';
    await ticket.update({ status });
    res.json({ success: true, ticket: serializeTicket(ticket) });
  } catch (error) {
    console.error('Update support ticket status error:', error);
    res.status(500).json({ success: false, error: 'Durum güncellenemedi' });
  }
});

module.exports = router;
