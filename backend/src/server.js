const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
// Rate limiting completely disabled - package still installed but not used
// const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Set default environment variables if not set
process.env.JWT_SECRET = process.env.JWT_SECRET || 'event_week_super_secret_key_2024_development_only';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.USE_SQLITE == null || process.env.USE_SQLITE === '') {
  process.env.USE_SQLITE = 'false';
}
process.env.PORT = process.env.PORT || 3000;

const { sequelize } = require('./database/connection');
const models = require('./models');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const programRoutes = require('./routes/programs');
const speakerRoutes = require('./routes/speakers');
const votingRoutes = require('./routes/voting');
const appointmentRoutes = require('./routes/appointments');
const transferRoutes = require('./routes/transfers');
const activityRoutes = require('./routes/activities');
const flightRoutes = require('./routes/flights');
const accommodationRoutes = require('./routes/accommodations');
const galleryRoutes = require('./routes/gallery');
const documentRoutes = require('./routes/documents');
const noteRoutes = require('./routes/notes');
const surveyRoutes = require('./routes/surveys');
const reportRoutes = require('./routes/reports');
const settingRoutes = require('./routes/settings');
const announcementRoutes = require('./routes/announcements');
const qrRoutes = require('./routes/qr');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const feedRoutes = require('./routes/feed');
const supportRoutes = require('./routes/support');
const quizRoutes = require('./routes/quiz');
const raffleRoutes = require('./routes/raffle');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// Rate limiting - COMPLETELY REMOVED
// Rate limiting middleware has been completely removed
// If you need to enable it in production, uncomment the lines below:
// const rateLimit = require('express-rate-limit');
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000,
//   message: { error: 'Too many requests from this IP, please try again later.' }
// });

// CORS configuration
// Development modunda tüm local IP'lere izin ver
const corsOptions = {
  origin: function (origin, callback) {
    // Development modunda tüm isteklere izin ver (Expo Go için gerekli)
    if (process.env.NODE_ENV === 'development') {
      // Localhost ve local network IP'leri için izin ver
      if (!origin || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') || 
          origin.match(/^http:\/\/192\.168\.\d+\.\d+/) ||
          origin.match(/^http:\/\/10\.\d+\.\d+\.\d+/) ||
          origin.match(/^http:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/)) {
        callback(null, true);
        return;
      }
    }
    // Production modunda sadece belirli origin'lere izin ver
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:19006',
      ...(process.env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean)
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));

// Configure Helmet to allow cross-origin resources for static files
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xFrameOptions: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http:", "https:", "blob:"],
      mediaSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http:", "https:"],
      frameAncestors: ["'self'", "http:", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined'));

// JSON and URL encoding middleware - MUST be before routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve uploaded files statically (for local storage) with CORS headers
const path = require('path');
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.removeHeader('X-Frame-Options');
  next();
}, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    if (!path.extname(filePath) && String(filePath).includes(`${path.sep}profiles${path.sep}`)) {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    if (String(filePath).toLowerCase().endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.removeHeader('X-Frame-Options');
    }
    if (/\.(mp4|webm|ogg|mov)$/i.test(String(filePath))) {
      res.setHeader('Accept-Ranges', 'bytes');
    }
  }
}));

// Root endpoint (before rate limiting)
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Event Week API',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      programs: '/api/programs',
      speakers: '/api/speakers',
      voting: '/api/voting',
      appointments: '/api/appointments',
      transfers: '/api/transfers',
      activities: '/api/activities',
      flights: '/api/flights',
      accommodations: '/api/accommodations',
      gallery: '/api/gallery',
      documents: '/api/documents',
      notes: '/api/notes',
      surveys: '/api/surveys',
      reports: '/api/reports',
      settings: '/api/settings',
      announcements: '/api/announcements',
      qr: '/api/qr',
      admin: '/api/admin',
      notifications: '/api/notifications',
      upload: '/api/upload',
      feed: '/api/feed',
      support: '/api/support',
      quiz: '/api/quiz'
    }
  });
});

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Auth routes (after JSON middleware)
app.use('/api/auth', authRoutes);

// Rate limiting - COMPLETELY REMOVED
// No rate limiting middleware is applied
// If you need to enable it in production, uncomment:
// app.use(limiter);
console.log('✅ Rate limiting COMPLETELY REMOVED - No rate limits applied');

// API Routes (after rate limiting)
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/voting', votingRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/accommodations', accommodationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/raffle', raffleRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    if (String(process.env.USE_SQLITE).toLowerCase() !== 'true') {
      try {
        await sequelize.sync();
        console.log('✅ Postgres tables ready.');
      } catch (syncError) {
        console.warn('⚠️ Sequelize sync skipped:', syncError.message);
      }
    }

    await models.Event.ensureIntroVideoColumns();
    await models.Setting.ensureAppLogo();
    await models.Setting.ensureAppIntroVideo();
    await models.Setting.ensureAppLauncherIcon();
    const { ensureFeatureSettings } = require('./services/featureSettings');
    await ensureFeatureSettings();
    await models.FeedItem.sync();
    await models.FeedItem.ensureMediaItemsColumn();
    await models.FeedLike.sync();
    await models.FeedComment.sync();
    await models.SupportTicket.sync();
    await models.SupportMessage.sync();
    await models.Quiz.sync();
    await models.QuizQuestion.sync();
    await models.QuizPlayer.sync();
    await models.QuizAnswer.sync();
    await models.RaffleDraw.sync();
    console.log('✅ Feed, support, quiz and raffle tables ready.');

    const adminCount = await models.User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@eventweek.com';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      await models.User.create({
        email,
        password,
        firstName: 'Admin',
        lastName: 'User',
        title: 'System Administrator',
        company: 'Event Week',
        role: 'admin',
        qrCode: 'ADMIN-001',
        isActive: true
      });
      console.log('✅ Bootstrap admin created:', email);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Unhandled error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately, let the server handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit immediately, let the server handle it
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
