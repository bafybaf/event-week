const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Event Week Backend is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    data: {
      users: [],
      events: [],
      status: 'ready'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server is running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Environment: development`);
});

module.exports = app;
