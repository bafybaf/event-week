const { isStaff, toRelativeUploadUrl } = require('./feedService');

const canViewTicket = (user, ticket) => {
  if (!user || !ticket) return false;
  return String(user.id) === String(ticket.userId) || isStaff(user);
};

const canReplyToTicket = (user, ticket) => {
  return canViewTicket(user, ticket) && ticket.status === 'open';
};

const canChangeTicketStatus = (user, ticket) => canViewTicket(user, ticket);

const validateTicketCreate = ({ subject, eventId, body, attachments }) => {
  if (!eventId) {
    return { ok: false, error: 'Etkinlik gerekli' };
  }
  if (!subject || String(subject).trim().length < 3) {
    return { ok: false, error: 'Konu en az 3 karakter olmalı' };
  }
  const files = normalizeAttachments(attachments);
  if (!String(body || '').trim() && files.length === 0) {
    return { ok: false, error: 'Mesaj veya ek gerekli' };
  }
  return { ok: true };
};

const attachmentCategory = (fileType = '', fileName = '') => {
  if (String(fileType).startsWith('image/') || /\.(jpe?g|png|gif|webp)$/i.test(fileName)) {
    return 'image';
  }
  return 'document';
};

const normalizeAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return [];
  return attachments
    .map((file) => {
      const url = toRelativeUploadUrl(file && file.url);
      if (!url) return null;
      const fileName = file.fileName || file.name || 'ek';
      const fileType = file.fileType || file.mimetype || '';
      return {
        url,
        fileName,
        fileType,
        fileSize: file.fileSize || file.size || null,
        category: file.category || attachmentCategory(fileType, fileName)
      };
    })
    .filter(Boolean);
};

const parseAttachments = (raw) => {
  if (Array.isArray(raw)) return normalizeAttachments(raw);
  if (!raw) return [];
  try {
    return normalizeAttachments(JSON.parse(raw));
  } catch (error) {
    return [];
  }
};

module.exports = {
  canViewTicket,
  canReplyToTicket,
  canChangeTicketStatus,
  validateTicketCreate,
  normalizeAttachments,
  parseAttachments
};
