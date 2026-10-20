const STAFF_ROLES = ['admin', 'organizer'];
const KINDS = ['post', 'story'];
const MEDIA_TYPES = ['image', 'video'];
const MAX_POST_MEDIA = 10;

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

const normalizeMediaList = (input, fallback = {}) => {
  let raw = input;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (error) {
      raw = [];
    }
  }
  const source = Array.isArray(raw) ? raw : [];
  const cleaned = source
    .map((entry) => {
      const type = entry && (entry.type || entry.mediaType);
      const url = toRelativeUploadUrl(entry && (entry.url || entry.mediaUrl));
      if (!url || !MEDIA_TYPES.includes(type)) return null;
      return {
        url,
        type,
        thumbnailUrl: toRelativeUploadUrl(entry.thumbnailUrl) || '',
        fileName: entry.fileName || '',
        fileSize: entry.fileSize || null
      };
    })
    .filter(Boolean)
    .slice(0, MAX_POST_MEDIA);

  if (!cleaned.length && fallback.mediaUrl) {
    const type = MEDIA_TYPES.includes(fallback.mediaType) ? fallback.mediaType : 'image';
    cleaned.push({
      url: toRelativeUploadUrl(fallback.mediaUrl),
      type,
      thumbnailUrl: toRelativeUploadUrl(fallback.thumbnailUrl) || '',
      fileName: fallback.fileName || '',
      fileSize: fallback.fileSize || null
    });
  }

  return cleaned;
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
  toRelativeUploadUrl,
  normalizeMediaList,
  MAX_POST_MEDIA
};
