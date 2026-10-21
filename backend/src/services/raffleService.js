const { Op } = require('sequelize');
const { User, Event, RaffleDraw, Setting } = require('../models');

function personName(user) {
  if (!user) return 'Katılımcı';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Katılımcı';
}

function isAllEvents(eventId) {
  return !eventId || eventId === 'all';
}

function serializeParticipant(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: personName(user),
    role: user.role || 'participant',
    eventId: user.eventId || null,
    company: user.company || '',
    title: user.title || '',
    department: user.department || '',
    phone: user.phoneNumber || user.phone || '',
    profileImage: user.profileImage || null,
    isActive: user.isActive !== false
  };
}

function serializeDraw(draw) {
  if (!draw) return null;
  const winner = draw.winner ? serializeParticipant(draw.winner) : {
    id: draw.winnerId,
    name: draw.winnerName
  };
  return {
    id: draw.id,
    eventId: draw.eventId,
    winnerId: draw.winnerId,
    winnerName: draw.winnerName,
    participantCount: draw.participantCount,
    drawnAt: draw.drawnAt,
    winner
  };
}

async function listParticipants(eventId) {
  const where = {
    role: { [Op.notIn]: ['speaker'] }
  };
  if (!isAllEvents(eventId)) {
    where[Op.or] = [
      { eventId },
      { eventId: null },
      { eventId: '' }
    ];
  }
  const users = await User.findAll({
    where,
    order: [['firstName', 'ASC'], ['lastName', 'ASC']]
  });
  return users.map(serializeParticipant);
}

async function getState(eventId) {
  let event = null;
  if (!isAllEvents(eventId)) {
    event = await Event.findByPk(eventId);
    if (!event) {
      const error = new Error('Etkinlik bulunamadı');
      error.status = 404;
      throw error;
    }
  }
  const participants = await listParticipants(eventId);
  const history = await RaffleDraw.findAll({
    where: isAllEvents(eventId) ? undefined : { eventId },
    include: [{ model: User, as: 'winner' }],
    order: [['drawnAt', 'DESC']],
    limit: 12
  });
  return {
    event: event
      ? { id: event.id, name: event.name }
      : { id: 'all', name: 'Tüm etkinlikler' },
    participants,
    lastDraw: history[0] ? serializeDraw(history[0]) : null,
    history: history.map(serializeDraw)
  };
}

async function draw(eventId) {
  const state = await getState(eventId);
  const pool = state.participants;
  if (!pool.length) {
    const error = new Error('Çekilişe katılacak kullanıcı yok');
    error.status = 400;
    throw error;
  }

  let candidates = pool;
  if (state.lastDraw && pool.length > 1) {
    candidates = pool.filter((p) => p.id !== state.lastDraw.winnerId);
    if (!candidates.length) candidates = pool;
  }

  const winner = candidates[Math.floor(Math.random() * candidates.length)];
  const winnerEventId = winner.eventId || (!isAllEvents(eventId) ? eventId : null);
  const fallbackEvent = winnerEventId ? null : await Event.findOne({ order: [['createdAt', 'ASC']] });
  const record = await RaffleDraw.create({
    eventId: winnerEventId || fallbackEvent.id,
    winnerId: winner.id,
    winnerName: winner.name,
    participantCount: pool.length,
    drawnAt: new Date()
  });
  const saved = await RaffleDraw.findByPk(record.id, {
    include: [{ model: User, as: 'winner' }]
  });
  const next = await getState(eventId);
  return {
    ...next,
    winner: serializeParticipant(saved.winner || winner),
    draw: serializeDraw(saved)
  };
}

const liveKey = (eventId) => `raffle_live:${eventId}`;

const closedLive = () => ({
  phase: 'closed',
  highlightName: '',
  highlightCompany: '',
  participantCount: 0,
  eventName: '',
  winner: null,
  updatedAt: null
});

function publicWinner(winner) {
  if (!winner || !winner.name) return null;
  return {
    name: String(winner.name || ''),
    company: String(winner.company || ''),
    title: String(winner.title || '')
  };
}

async function publishLive(eventId, body = {}) {
  if (!eventId || eventId === 'all') {
    const error = new Error('Etkinlik gerekli');
    error.status = 400;
    throw error;
  }
  const payload = {
    phase: ['roster', 'draw', 'spinning', 'revealed'].includes(body.phase) ? body.phase : 'roster',
    highlightName: String(body.highlightName || '').slice(0, 120),
    highlightCompany: String(body.highlightCompany || '').slice(0, 120),
    participantCount: Number(body.participantCount) || 0,
    eventName: String(body.eventName || '').slice(0, 160),
    winner: publicWinner(body.winner),
    updatedAt: new Date().toISOString()
  };
  const key = liveKey(eventId);
  const value = JSON.stringify(payload);
  const existing = await Setting.findOne({ where: { key } });
  if (existing) {
    await existing.update({ value, isActive: true });
  } else {
    await Setting.create({
      key,
      value,
      type: 'json',
      category: 'feature',
      description: 'Canlı çekiliş sahnesi',
      isPublic: false,
      isEditable: true,
      eventId: null,
      group: 'raffle',
      isActive: true
    });
  }
  return payload;
}

async function getLive(eventId) {
  if (!eventId) return closedLive();
  const setting = await Setting.findOne({ where: { key: liveKey(eventId), isActive: true } });
  if (!setting?.value) return closedLive();
  try {
    const parsed = JSON.parse(setting.value);
    return { ...closedLive(), ...parsed, winner: publicWinner(parsed.winner) };
  } catch (error) {
    return closedLive();
  }
}

async function closeLive(eventId) {
  if (!eventId || eventId === 'all') return closedLive();
  await Setting.destroy({ where: { key: liveKey(eventId) } });
  return closedLive();
}

module.exports = {
  getState,
  draw,
  publishLive,
  getLive,
  closeLive
};
