const Event = require('../models/Event');
const User = require('../models/User');

const participantLimitError = async (eventId) => {
  if (!eventId) return null;

  const event = await Event.findByPk(eventId);
  if (!event) return 'Etkinlik bulunamadı';

  const limit = Number(event.maxParticipants);
  if (!Number.isFinite(limit) || limit <= 0) return null;

  const count = await User.count({
    where: { eventId, role: 'participant', isActive: true }
  });

  if (count >= limit) {
    return `Bu etkinlik en fazla ${limit} katılımcı alabilir`;
  }

  return null;
};

module.exports = { participantLimitError };
