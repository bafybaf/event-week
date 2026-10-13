const express = require('express');
const { adminAuth } = require('../middleware/auth');
const raffleService = require('../services/raffleService');

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

router.get('/', adminAuth, asyncHandler(async (req, res) => {
  try {
    const state = await raffleService.getState(req.query.eventId || 'all');
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

router.post('/draw', adminAuth, asyncHandler(async (req, res) => {
  try {
    const eventId = req.body.eventId || req.query.eventId || 'all';
    const state = await raffleService.draw(eventId);
    res.json({ success: true, state });
  } catch (error) {
    fail(res, error);
  }
}));

module.exports = router;
