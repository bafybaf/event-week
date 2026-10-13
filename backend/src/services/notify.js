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
  notifyUser,
  notifyUsers,
  notifyStaff,
  preview,
  stripHtml,
};
