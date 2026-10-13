const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const quizService = require('../services/quizService');

const router = express.Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const fail = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    success: false,
    error: error.message || 'Server error'
  });
};

router.get('/', auth, asyncHandler(async (req, res) => {
  try {
    const quizzes = await quizService.listQuizzes(req.query.eventId);
    res.json({ success: true, quizzes });
  } catch (error) {
    fail(res, error);
  }
}));

router.get('/live', auth, asyncHandler(async (req, res) => {
  try {
    const eventId = req.query.eventId || req.user.eventId;
    const quiz = await quizService.findLive(eventId);
    if (!quiz) {
      return res.json({ success: true, quiz: null, state: null });
    }
    const state = await quizService.serializeState(quiz, { userId: req.user.id, host: false });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.get('/:id', auth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.loadQuiz(req.params.id);
    const host = req.query.host === '1' && ['admin', 'organizer'].includes(req.user.role);
    const state = await quizService.serializeState(quiz, { userId: req.user.id, host });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.createQuiz(req.body);
    const state = await quizService.serializeState(quiz, { host: true });
    res.status(201).json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.put('/:id', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.updateQuiz(req.params.id, req.body);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.delete('/:id', adminAuth, asyncHandler(async (req, res) => {
  try {
    await quizService.deleteQuiz(req.params.id);
    res.json({ success: true });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/join', auth, asyncHandler(async (req, res) => {
  try {
    await quizService.joinQuiz(req.params.id, req.user);
    const quiz = await quizService.loadQuiz(req.params.id);
    const state = await quizService.serializeState(quiz, { userId: req.user.id });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/answer', auth, asyncHandler(async (req, res) => {
  try {
    await quizService.submitAnswer(req.params.id, req.user, req.body.selectedIndex);
    const quiz = await quizService.loadQuiz(req.params.id);
    const state = await quizService.serializeState(quiz, { userId: req.user.id });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/lobby', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.openLobby(req.params.id);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/ask', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.askQuestion(req.params.id);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/reveal', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.revealQuestion(req.params.id);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/leaderboard', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.showLeaderboard(req.params.id);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/end', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.endQuiz(req.params.id);
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/:id/raffle', adminAuth, asyncHandler(async (req, res) => {
  try {
    const quiz = await quizService.drawRaffle(req.params.id, req.body.pool || 'all');
    const state = await quizService.serializeState(quiz, { host: true });
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

module.exports = router;
