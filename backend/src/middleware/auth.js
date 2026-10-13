const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or user not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired.' 
      });
    }
    res.status(500).json({ 
      error: 'Server error during authentication.' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
        return res.status(403).json({ 
          error: 'Access denied. Admin privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error during admin authentication.' 
    });
  }
};

const speakerAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!['speaker', 'admin', 'organizer'].includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Access denied. Speaker privileges required.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error during speaker authentication.' 
    });
  }
};

module.exports = {
  auth,
  adminAuth,
  speakerAuth
};
