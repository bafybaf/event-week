const { Op } = require('sequelize');
const Setting = require('../models/Setting');

const UNUSED_KEYS = [
  'app.name',
  'app.version',
  'notification.email.enabled',
  'event.max_participants'
];

const FEATURES = [
  {
    key: 'feed.posts_enabled',
    value: 'true',
    description: 'Katılımcılar akışa paylaşım ekleyebilir',
    order: 1
  },
  {
    key: 'feed.stories_enabled',
    value: 'true',
    description: 'Katılımcılar hikaye ekleyebilir',
    order: 2
  },
  {
    key: 'feed.comments_enabled',
    value: 'true',
    description: 'Paylaşımlara yorum yazılabilir',
    order: 3
  }
];

const FALSE_VALUES = new Set(['false', '0', 'hayir', 'hayır', 'no', 'off', 'kapali', 'kapalı']);
const TRUE_VALUES = new Set(['true', '1', 'evet', 'yes', 'on', 'acik', 'açık']);

const isEnabled = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (FALSE_VALUES.has(normalized)) return false;
  if (TRUE_VALUES.has(normalized)) return true;
  return fallback;
};

const ensureFeatureSettings = async () => {
  await Setting.sync();
  await Setting.destroy({ where: { key: { [Op.in]: UNUSED_KEYS } } });

  for (const feature of FEATURES) {
    const existing = await Setting.findOne({ where: { key: feature.key } });
    if (existing) continue;
    await Setting.create({
      key: feature.key,
      value: feature.value,
      type: 'boolean',
      category: 'feature',
      description: feature.description,
      isPublic: true,
      isEditable: true,
      isRequired: true,
      eventId: null,
      group: 'feed',
      order: feature.order,
      isActive: true
    });
  }
};

const readFeatures = async () => {
  const rows = await Setting.findAll({
    where: { key: { [Op.in]: FEATURES.map((feature) => feature.key) } }
  });
  const map = {};
  rows.forEach((row) => {
    map[row.key] = row.value;
  });

  return {
    postsEnabled: isEnabled(map['feed.posts_enabled'], true),
    storiesEnabled: isEnabled(map['feed.stories_enabled'], true),
    commentsEnabled: isEnabled(map['feed.comments_enabled'], true)
  };
};

module.exports = {
  UNUSED_KEYS,
  FEATURES,
  isEnabled,
  ensureFeatureSettings,
  readFeatures
};
