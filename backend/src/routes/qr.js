const express = require('express');
const router = express.Router();

router.post('/scan', async (req, res) => {
  res.json({ success: true, data: {}, message: 'QR scan endpoint - to be implemented' });
});

module.exports = router;
