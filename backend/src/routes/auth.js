const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
  body('company').optional().trim(),
  body('department').optional().trim(),
  body('title').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, company, department, title, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      company,
      department,
      title,
      phone
    });

    // Generate QR code
    const qrCode = `EW-${user.id.substring(0, 8).toUpperCase()}`;
    await user.update({ qrCode });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        department: user.department,
        title: user.title,
        phone: user.phone,
        role: user.role,
        qrCode: user.qrCode
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password')
    .exists()
    .withMessage('Şifre gereklidir')
    .notEmpty()
    .withMessage('Şifre boş olamaz')
], async (req, res) => {
  try {
    console.log('Login request received:', { 
      email: req.body.email, 
      password: req.body.password ? '***' : 'MISSING',
      body: req.body 
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Geçersiz giriş bilgileri',
        errors: errors.array()
      });
    }

    let { email, password } = req.body;

    // Normalize email manually (trim and lowercase)
    email = email ? email.trim().toLowerCase() : email;

    console.log('Login attempt:', { email, password: '***' });

    // Find user
    const user = await User.findOne({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check password
    if (!user.password) {
      console.error('User has no password set:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    let isMatch = false;
    try {
      isMatch = await user.validatePassword(password);
    console.log('Password match:', isMatch);
    } catch (passwordError) {
      console.error('Password validation error:', passwordError);
      return res.status(500).json({
        success: false,
        error: 'Password validation failed',
        details: process.env.NODE_ENV === 'development' ? passwordError.message : undefined
      });
    }
    
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Update last login
    try {
    await user.update({ lastLogin: new Date() });
    } catch (updateError) {
      console.error('Failed to update last login:', updateError);
      // Don't fail login if last login update fails
    }

    // Generate token
    let token;
    try {
      token = generateToken(user.id);
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(500).json({
        success: false,
        error: 'Token generation failed',
        details: process.env.NODE_ENV === 'development' ? tokenError.message : undefined
      });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        department: user.department,
        title: user.title,
        phone: user.phone,
        role: user.role,
        qrCode: user.qrCode,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Reload user to get latest data from database
    await req.user.reload();
    
    const userData = req.user.toJSON();
    console.log('📤 /auth/me response:', {
      id: userData.id,
      name: `${userData.firstName} ${userData.lastName}`,
      profileImage: userData.profileImage,
      profileImageType: typeof userData.profileImage,
    });
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate reset token (in a real app, you'd send this via email)
    const resetToken = jwt.sign(
      { id: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset token
    console.log('Password reset token:', resetToken);

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password (Admin only)
// @access  Private (Admin)
router.put('/change-password', auth, [
  body('currentPassword').optional({ nullable: true, checkFalsy: true }),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalıdır'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Kullanıcıyı şifre ile birlikte yükle
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // Mevcut şifreyi kontrol et (şifresi olmayan hesaplarda atlanır)
    if (user.password) {
      const isMatch = await user.validatePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Mevcut şifre yanlış'
        });
      }
    }

    // Yeni şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Şifre değiştirilirken hata oluştu'
    });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    
    res.json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
