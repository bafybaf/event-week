const notificationService = require('./notificationService');

const stripHtml = (html) => String(html || '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const preview = (text, max = 140) => {
  const clean = stripHtml(text);
  if (!clean) return '';
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
};

const fireAndForget = (promise) => {
  Promise.resolve(promise).catch((error) => {
    console.error('Push notification error:', error.message || error);
  });
};

const summarizeTickets = (tickets) => {
  const list = Array.isArray(tickets) ? tickets : [];
  return {
    sentCount: list.length,
    okCount: list.filter((ticket) => ticket && ticket.status === 'ok').length,
    errorMessages: list
      .filter((ticket) => ticket && ticket.status === 'error' && ticket.message)
      .map((ticket) => ticket.message),
  };
};

const pushMessage = (eventName, result) => {
  const name = eventName || 'Seçili etkinlik';
  if (result.okCount > 0) {
    return `${name} etkinliğine bildirim ${result.okCount} telefona gönderildi`;
  }
  if (result.sentCount > 0) {
    return `${name} etkinliğinde ${result.sentCount} telefon kayıtlı ama bildirim iletilemedi.`;
  }
  return `${name} etkinliğinde bildirim alacak kayıtlı telefon yok. Katılımcı bu etkinlikle giriş yapıp bildirim iznini vermeli.`;
};

const notifyEventAndWait = async (eventId, notification, options = {}) => {
  if (!eventId) {
    return { sentCount: 0, okCount: 0, errorMessages: [] };
  }
  const tickets = await notificationService.sendEventNotification(eventId, notification, options);
  return summarizeTickets(tickets);
};

const reportEventPush = async (eventId, notification, options = {}) => {
  const result = await notifyEventAndWait(eventId, notification, options);
  let eventName = 'Seçili etkinlik';
  if (eventId) {
    try {
      const { Event } = require('../models');
      const event = await Event.findByPk(eventId, { attributes: ['id', 'name'] });
      if (event && event.name) eventName = event.name;
    } catch (error) {
      console.error('Event name lookup for push failed:', error.message);
    }
  }
  return {
    ...result,
    eventName,
    message: pushMessage(eventName, result),
  };
};

const notifyEvent = (eventId, notification, options = {}) => {
  if (!eventId) return;
  fireAndForget(notificationService.sendEventNotification(eventId, notification, options));
};

const notifyUser = (userId, notification) => {
  if (!userId) return;
  fireAndForget(notificationService.sendUserNotification(userId, notification));
};

const notifyUsers = (userIds, notification) => {
  if (!userIds || !userIds.length) return;
  fireAndForget(notificationService.sendUsersNotification(userIds, notification));
};

const notifyStaff = (eventId, notification, options = {}) => {
  fireAndForget(notificationService.sendStaffNotification(eventId, notification, options));
};

module.exports = {
  notifyEvent,
  notifyEventAndWait,
  reportEventPush,
  pushMessage,
  notifyUser,
  notifyUsers,
  notifyStaff,
  summarizeTickets,
  preview,
  stripHtml,
};
