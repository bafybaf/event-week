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

const notifyEventAndWait = async (eventId, notification, options = {}) => {
  if (!eventId) {
    return { sentCount: 0, okCount: 0, errorMessages: [] };
  }
  const tickets = await notificationService.sendEventNotification(eventId, notification, options);
  return summarizeTickets(tickets);
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
  notifyUser,
  notifyUsers,
  notifyStaff,
  summarizeTickets,
  preview,
  stripHtml,
};
