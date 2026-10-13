const { Op } = require('sequelize');
const { Quiz, QuizQuestion, QuizPlayer, QuizAnswer, User, Event } = require('../models');
const { notifyEvent } = require('./notify');

const LIVE_STATUSES = ['lobby', 'question', 'reveal', 'leaderboard'];
const BASE_POINTS = 1000;

function personName(user) {
  if (!user) return 'Katılımcı';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Katılımcı';
}

function remainingMs(startedAt, timeLimitSec) {
  if (!startedAt) return 0;
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return Math.max(0, (timeLimitSec || 20) * 1000 - elapsed);
}

function pointsFor(elapsedMs, timeLimitSec) {
  const limit = Math.max(1, (timeLimitSec || 20) * 1000);
  if (elapsedMs > limit) return 0;
  const ratio = Math.min(1, Math.max(0, elapsedMs / limit));
  return Math.round(BASE_POINTS * (1 - ratio * 0.5));
}

function normalizeQuestions(input) {
  if (!Array.isArray(input) || !input.length) {
    throw new Error('En az bir soru gerekli');
  }
  return input.map((raw, index) => {
    const options = (raw.options || []).map((opt) => String(opt || '').trim()).filter(Boolean);
    if (!raw.text || !String(raw.text).trim()) {
      throw new Error(`Soru ${index + 1} metni boş`);
    }
    if (options.length < 2) {
      throw new Error(`Soru ${index + 1} için en az 2 şık gerekli`);
    }
    const correctIndex = Number(raw.correctIndex);
    if (Number.isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      throw new Error(`Soru ${index + 1} doğru şıkkı geçersiz`);
    }
    const timeLimit = Math.min(60, Math.max(5, Number(raw.timeLimit) || 20));
    return {
      sortOrder: index,
      text: String(raw.text).trim(),
      options,
      correctIndex,
      timeLimit
    };
  });
}

async function getQuestions(quizId) {
  return QuizQuestion.findAll({
    where: { quizId },
    order: [['sortOrder', 'ASC']]
  });
}

async function ensurePhase(quiz) {
  if (quiz.status !== 'question' || !quiz.questionStartedAt) return quiz;
  const questions = await getQuestions(quiz.id);
  const current = questions[quiz.currentQuestionIndex];
  if (!current) return quiz;
  if (remainingMs(quiz.questionStartedAt, current.timeLimit) <= 0) {
    quiz.status = 'reveal';
    await quiz.save();
  }
  return quiz;
}

async function loadQuiz(id) {
  const quiz = await Quiz.findByPk(id);
  if (!quiz) {
    const error = new Error('Quiz bulunamadı');
    error.status = 404;
    throw error;
  }
  return ensurePhase(quiz);
}

async function replaceQuestions(quizId, questions) {
  await QuizQuestion.destroy({ where: { quizId } });
  await QuizQuestion.bulkCreate(questions.map((item) => ({ ...item, quizId })));
}

async function listQuizzes(eventId) {
  const where = eventId ? { eventId } : {};
  const quizzes = await Quiz.findAll({
    where,
    include: [{ model: Event, as: 'event', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']]
  });
  const withCounts = await Promise.all(quizzes.map(async (quiz) => {
    const questionCount = await QuizQuestion.count({ where: { quizId: quiz.id } });
    const playerCount = await QuizPlayer.count({ where: { quizId: quiz.id } });
    return {
      ...quiz.toJSON(),
      questionCount,
      playerCount
    };
  }));
  return withCounts;
}

async function findLive(eventId) {
  if (!eventId) return null;
  const quiz = await Quiz.findOne({
    where: { eventId, status: { [Op.in]: LIVE_STATUSES } },
    order: [['updatedAt', 'DESC']]
  });
  if (quiz) return ensurePhase(quiz);
  const ended = await Quiz.findOne({
    where: { eventId, status: 'ended' },
    order: [['updatedAt', 'DESC']]
  });
  return ended || null;
}

async function createQuiz({ eventId, title, questions }) {
  if (!eventId || !title) {
    const error = new Error('Etkinlik ve başlık zorunlu');
    error.status = 400;
    throw error;
  }
  const normalized = normalizeQuestions(questions);
  const quiz = await Quiz.create({ eventId, title: String(title).trim(), status: 'draft' });
  await replaceQuestions(quiz.id, normalized);
  return loadQuiz(quiz.id);
}

async function updateQuiz(id, { title, questions }) {
  const quiz = await loadQuiz(id);
  if (quiz.status !== 'draft') {
    const error = new Error('Yalnızca taslak quiz düzenlenebilir');
    error.status = 400;
    throw error;
  }
  if (title) quiz.title = String(title).trim();
  await quiz.save();
  if (questions) {
    await replaceQuestions(quiz.id, normalizeQuestions(questions));
  }
  return loadQuiz(quiz.id);
}

async function deleteQuiz(id) {
  const quiz = await loadQuiz(id);
  if (LIVE_STATUSES.includes(quiz.status)) {
    const error = new Error('Canlı oturum bitmeden silinemez');
    error.status = 400;
    throw error;
  }
  await QuizAnswer.destroy({ where: { quizId: id } });
  await QuizPlayer.destroy({ where: { quizId: id } });
  await QuizQuestion.destroy({ where: { quizId: id } });
  await quiz.destroy();
}

async function openLobby(id) {
  const quiz = await loadQuiz(id);
  const questions = await getQuestions(quiz.id);
  if (!questions.length) {
    const error = new Error('Soru eklemeden oturum açılamaz');
    error.status = 400;
    throw error;
  }
  await Quiz.update(
    { status: 'ended' },
    { where: { eventId: quiz.eventId, id: { [Op.ne]: quiz.id }, status: { [Op.in]: LIVE_STATUSES } } }
  );
  await QuizAnswer.destroy({ where: { quizId: quiz.id } });
  await QuizPlayer.update({ score: 0 }, { where: { quizId: quiz.id } });
  quiz.status = 'lobby';
  quiz.currentQuestionIndex = 0;
  quiz.questionStartedAt = null;
  quiz.raffleWinnerId = null;
  quiz.rafflePool = null;
  quiz.raffleDrawnAt = null;
  await quiz.save();
  notifyEvent(quiz.eventId, {
    title: 'Canlı quiz başlıyor',
    body: quiz.title,
    data: { type: 'quiz', screen: '/quiz', quizId: quiz.id }
  });
  return quiz;
}

async function askQuestion(id) {
  const quiz = await loadQuiz(id);
  const questions = await getQuestions(quiz.id);
  if (!questions.length) {
    const error = new Error('Soru yok');
    error.status = 400;
    throw error;
  }
  if (quiz.status === 'lobby') {
    quiz.currentQuestionIndex = 0;
  } else if (quiz.status === 'reveal' || quiz.status === 'leaderboard') {
    if (quiz.currentQuestionIndex >= questions.length - 1) {
      quiz.status = 'leaderboard';
      quiz.questionStartedAt = null;
      await quiz.save();
      return quiz;
    }
    quiz.currentQuestionIndex += 1;
  } else if (quiz.status === 'question') {
    return quiz;
  } else if (quiz.status === 'draft' || quiz.status === 'ended') {
    const error = new Error('Önce lobiyi açın');
    error.status = 400;
    throw error;
  }
  quiz.status = 'question';
  quiz.questionStartedAt = new Date();
  await quiz.save();
  return quiz;
}

async function revealQuestion(id) {
  const quiz = await loadQuiz(id);
  if (quiz.status !== 'question' && quiz.status !== 'reveal') {
    const error = new Error('Gösterilecek aktif soru yok');
    error.status = 400;
    throw error;
  }
  quiz.status = 'reveal';
  await quiz.save();
  return quiz;
}

async function showLeaderboard(id) {
  const quiz = await loadQuiz(id);
  quiz.status = 'leaderboard';
  quiz.questionStartedAt = null;
  await quiz.save();
  return quiz;
}

async function endQuiz(id) {
  const quiz = await loadQuiz(id);
  quiz.status = 'ended';
  quiz.questionStartedAt = null;
  await quiz.save();
  return quiz;
}

async function joinQuiz(id, user) {
  const quiz = await loadQuiz(id);
  if (!LIVE_STATUSES.includes(quiz.status)) {
    const error = new Error('Katılınacak canlı oturum yok');
    error.status = 400;
    throw error;
  }
  const [player] = await QuizPlayer.findOrCreate({
    where: { quizId: quiz.id, userId: user.id },
    defaults: { quizId: quiz.id, userId: user.id, score: 0, joinedAt: new Date() }
  });
  return player;
}

async function submitAnswer(id, user, selectedIndex) {
  const quiz = await loadQuiz(id);
  if (quiz.status !== 'question') {
    const error = new Error('Şu anda cevap kabul edilmiyor');
    error.status = 400;
    throw error;
  }
  const questions = await getQuestions(quiz.id);
  const current = questions[quiz.currentQuestionIndex];
  if (!current) {
    const error = new Error('Aktif soru yok');
    error.status = 400;
    throw error;
  }
  const elapsedMs = Date.now() - new Date(quiz.questionStartedAt).getTime();
  if (elapsedMs > current.timeLimit * 1000) {
    quiz.status = 'reveal';
    await quiz.save();
    const error = new Error('Süre doldu');
    error.status = 400;
    throw error;
  }
  const choice = Number(selectedIndex);
  if (Number.isNaN(choice) || choice < 0 || choice >= current.options.length) {
    const error = new Error('Geçersiz şık');
    error.status = 400;
    throw error;
  }
  await joinQuiz(quiz.id, user);
  const existing = await QuizAnswer.findOne({
    where: { questionId: current.id, userId: user.id }
  });
  const isCorrect = choice === current.correctIndex;
  const points = isCorrect ? pointsFor(elapsedMs, current.timeLimit) : 0;

  if (existing) {
    const previousPoints = existing.points || 0;
    existing.selectedIndex = choice;
    existing.elapsedMs = elapsedMs;
    existing.points = points;
    existing.isCorrect = isCorrect;
    await existing.save();
    if (previousPoints !== points) {
      await QuizPlayer.increment('score', {
        by: points - previousPoints,
        where: { quizId: quiz.id, userId: user.id }
      });
    }
    return existing;
  }

  const answer = await QuizAnswer.create({
    quizId: quiz.id,
    questionId: current.id,
    userId: user.id,
    selectedIndex: choice,
    elapsedMs,
    points,
    isCorrect
  });
  if (points) {
    await QuizPlayer.increment('score', { by: points, where: { quizId: quiz.id, userId: user.id } });
  }
  return answer;
}

async function drawRaffle(id, pool = 'all') {
  const quiz = await loadQuiz(id);
  const where = { quizId: quiz.id };
  if (pool === 'scored') where.score = { [Op.gt]: 0 };
  const players = await QuizPlayer.findAll({ where, include: [{ model: User, as: 'user' }] });
  if (!players.length) {
    const error = new Error('Çekiliş için katılımcı yok');
    error.status = 400;
    throw error;
  }
  const winner = players[Math.floor(Math.random() * players.length)];
  quiz.raffleWinnerId = winner.userId;
  quiz.rafflePool = pool === 'scored' ? 'scored' : 'all';
  quiz.raffleDrawnAt = new Date();
  await quiz.save();
  return quiz;
}

async function leaderboard(quizId, limit = 10) {
  const players = await QuizPlayer.findAll({
    where: { quizId },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['score', 'DESC'], ['joinedAt', 'ASC']],
    limit
  });
  return players.map((player, index) => ({
    rank: index + 1,
    userId: player.userId,
    name: personName(player.user),
    score: player.score
  }));
}

async function serializeState(quiz, { userId, host = false } = {}) {
  quiz = await ensurePhase(quiz);
  const questions = await getQuestions(quiz.id);
  const current = questions[quiz.currentQuestionIndex] || null;
  const playerCount = await QuizPlayer.count({ where: { quizId: quiz.id } });
  const showCorrect = host || quiz.status === 'reveal' || quiz.status === 'leaderboard' || quiz.status === 'ended';
  let counts = [];
  if (current && (host || showCorrect)) {
    const answers = await QuizAnswer.findAll({ where: { questionId: current.id } });
    counts = current.options.map((_, index) => answers.filter((item) => item.selectedIndex === index).length);
  }
  let me = null;
  if (userId) {
    const player = await QuizPlayer.findOne({ where: { quizId: quiz.id, userId } });
    const mine = current
      ? await QuizAnswer.findOne({ where: { questionId: current.id, userId } })
      : null;
    const board = await leaderboard(quiz.id, 200);
    const mineRank = board.find((row) => row.userId === userId);
    me = {
      joined: !!player,
      score: player ? player.score : 0,
      rank: mineRank ? mineRank.rank : null,
      selectedIndex: mine ? mine.selectedIndex : null,
      isCorrect: mine ? mine.isCorrect : null,
      points: mine ? mine.points : 0
    };
  }
  let raffle = null;
  if (quiz.raffleWinnerId) {
    const winner = await User.findByPk(quiz.raffleWinnerId);
    raffle = {
      winnerId: quiz.raffleWinnerId,
      winnerName: personName(winner),
      pool: quiz.rafflePool,
      drawnAt: quiz.raffleDrawnAt
    };
  }
  return {
    quiz: {
      id: quiz.id,
      eventId: quiz.eventId,
      title: quiz.title,
      status: quiz.status,
      currentQuestionIndex: quiz.currentQuestionIndex,
      questionCount: questions.length,
      playerCount,
      questionStartedAt: quiz.questionStartedAt,
      timeRemainingMs: current ? remainingMs(quiz.questionStartedAt, current.timeLimit) : 0
    },
    question: current ? {
      id: current.id,
      text: current.text,
      options: current.options.map((text, index) => ({
        index,
        text,
        count: counts[index] != null ? counts[index] : null,
        correct: showCorrect ? index === current.correctIndex : null
      })),
      timeLimit: current.timeLimit,
      index: quiz.currentQuestionIndex,
      total: questions.length
    } : null,
    questions: host ? questions.map((item, index) => ({
      id: item.id,
      text: item.text,
      options: item.options,
      correctIndex: item.correctIndex,
      timeLimit: item.timeLimit,
      sortOrder: index
    })) : undefined,
    leaderboard: await leaderboard(quiz.id, host ? 50 : 8),
    me,
    raffle
  };
}

module.exports = {
  listQuizzes,
  findLive,
  loadQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  openLobby,
  askQuestion,
  revealQuestion,
  showLeaderboard,
  endQuiz,
  joinQuiz,
  submitAnswer,
  drawRaffle,
  serializeState,
  getQuestions
};
