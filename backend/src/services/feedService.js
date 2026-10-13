const STAFF_ROLES = ['admin', 'organizer'];
const KINDS = ['post', 'story'];
const MEDIA_TYPES = ['image', 'video'];

const isStaff = (user) => STAFF_ROLES.includes(user && user.role);

const canManageItem = (user, item) => {
  if (!user || !item) return false;
  return String(user.id) === String(item.authorId) || isStaff(user);
};

const canDeleteComment = (user, comment) => {
  if (!user || !comment) return false;
  return String(user.id) === String(comment.userId) || isStaff(user);
};

const resolveEventScope = (user, requestedEventId) => {
  if (isStaff(user)) {
    const eventId = requestedEventId ? String(requestedEventId) : null;
    return { eventId };
  }

  if (!user || !user.eventId) {
    return { error: 'Etkinlik bilgisi bulunamadı' };
  }

  return { eventId: String(user.eventId) };
};

const validateCreatePayload = ({ kind, mediaUrl, mediaType, eventId }) => {
  if (!eventId) {
    return { ok: false, error: 'Etkinlik gerekli' };
  }
  if (!KINDS.includes(kind)) {
    return { ok: false, error: 'Geçersiz paylaşım türü' };
  }
  if (!mediaUrl) {
    return { ok: false, error: 'Görsel veya video gerekli' };
  }
  if (!MEDIA_TYPES.includes(mediaType)) {
    return { ok: false, error: 'Geçersiz medya türü' };
  }
  return { ok: true };
};

const splitFeedItems = (items = []) => {
  const active = items.filter((item) => item && item.isActive !== false);
  return {
    stories: active.filter((item) => item.kind === 'story'),
    posts: active.filter((item) => item.kind === 'post')
  };
};

const toRelativeUploadUrl = (url) => {
  if (!url) return '';
  const uploadsIndex = String(url).indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    return String(url).slice(uploadsIndex);
  }
  return String(url);
};

module.exports = {
  isStaff,
  canManageItem,
  canDeleteComment,
  resolveEventScope,
  validateCreatePayload,
  splitFeedItems,
  toRelativeUploadUrl
};
