const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');
const { sequelize } = require('../database/connection');
const { participantLimitError } = require('../services/participantLimit');
const { QueryTypes } = require('sequelize');

const getPhoneVariants = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  const variants = new Set();
  if (!digits) return [];

  variants.add(digits);
  if (digits.startsWith('0') && digits.length > 1) {
    variants.add(digits.substring(1));
  }
  if (digits.startsWith('90') && digits.length > 2) {
    variants.add(digits.substring(2));
  }
  if (digits.length === 10) {
    variants.add(`0${digits}`);
    variants.add(`90${digits}`);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    variants.add(digits.substring(1));
    variants.add(`90${digits.substring(1)}`);
  }
  return Array.from(variants);
};

const EVENT_BRANDING_ATTRS = [
  'id',
  'name',
  'description',
  'startDate',
  'endDate',
  'location',
  'status',
  'city',
  'coverImage',
  'logo',
  'appLogo',
  'introVideoUrl',
  'introVideoFileName'
];

const findActiveUserWithEventByPhone = async (phoneNumber, eventId) => {
  const cleanPhone = String(phoneNumber || '').replace(/\D/g, '');
  if (cleanPhone.length < 10) return null;

  const variants = getPhoneVariants(cleanPhone);
  const last10 = cleanPhone.slice(-10);
  const phoneWhere = {
    [Op.or]: [
      { phoneNumber: { [Op.in]: variants } },
      { phone: { [Op.in]: variants } },
      ...(last10.length === 10
        ? [
            { phoneNumber: { [Op.like]: `%${last10}` } },
            { phone: { [Op.like]: `%${last10}` } }
          ]
        : [])
    ]
  };

  const where = {
    isActive: true,
    ...phoneWhere
  };

  if (eventId) {
    where.eventId = eventId;
  }

  return User.findOne({
    where,
    attributes: { exclude: ['password'] },
    include: [{
      model: Event,
      as: 'event',
      attributes: EVENT_BRANDING_ATTRS
    }],
    order: [['updatedAt', 'DESC']]
  });
};

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin/Organizer)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Create user request:', req.body);
    
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      phoneNumber, 
      phone, 
      role, 
      company, 
      department, 
      title, 
      password,
      eventId,
      isActive = true 
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'Ad, soyad ve e-posta alanları zorunludur'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email: email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Bu e-posta adresi ile zaten kayıtlı bir kullanıcı var'
      });
    }

    const nextRole = role || 'participant';
    if (nextRole === 'participant' && eventId) {
      const limitError = await participantLimitError(eventId);
      if (limitError) {
        return res.status(400).json({ success: false, error: limitError });
      }
    }

    // Create user
    const userData = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || phone,
      phone: phone || phoneNumber,
      role: role || 'participant',
      company: company || '',
      department: department || '',
      title: title || '',
      password: password || 'temp123', // Default password
      eventId: eventId || null,
      isActive: isActive
    };

    console.log('👤 Creating user with data:', userData);

    const user = await User.create(userData);
    
    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    console.log('✅ User created successfully:', userResponse);

    res.status(201).json({
      success: true,
      user: userResponse,
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı oluşturulurken bir hata oluştu'
    });
  }
});

// @route   POST /api/users/lookup-phone
// @desc    Public branding preview for a phone number (no JWT)
// @access  Public (for mobile app)
router.post('/lookup-phone', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await findActiveUserWithEventByPhone(phoneNumber);
    const event = user && user.event ? user.event : null;

    res.json({
      success: true,
      event: event
        ? {
            id: event.id,
            name: event.name,
            logo: event.logo || event.appLogo || null,
            appLogo: event.appLogo || event.logo || null,
            introVideoUrl: event.introVideoUrl || null
          }
        : null
    });
  } catch (error) {
    console.error('Phone lookup error:', error);
    res.json({
      success: true,
      event: null
    });
  }
});

// @route   POST /api/users/validate-phone
// @desc    Validate user by phone number and open their assigned event
// @access  Public (for mobile app)
router.post('/validate-phone', async (req, res) => {
  try {
    const { phoneNumber, eventId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası gerekli'
      });
    }

    const cleanPhone = String(phoneNumber).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz telefon numarası'
      });
    }

    const user = await findActiveUserWithEventByPhone(cleanPhone, eventId);

    if (!user || !user.eventId) {
      return res.status(404).json({
        success: false,
        error: 'Bu telefon numarası ile kayıtlı kullanıcı bulunamadı'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        eventId: user.eventId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token: token,
      user: user,
      event: user.event,
      message: 'Kullanıcı doğrulandı'
    });

  } catch (error) {
    console.error('Phone validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// @route   POST /api/users/register-mobile
// @desc    Register new user from mobile app
// @access  Public (for mobile app)
router.post('/register-mobile', async (req, res) => {
  try {
    const { phoneNumber, eventId, firstName, lastName, email } = req.body;

    if (!phoneNumber || !eventId || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Telefon numarası, etkinlik ID, ad ve soyad gerekli'
      });
    }

    // Telefon numarasını temizle
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Etkinliğin var olup olmadığını kontrol et
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Etkinlik bulunamadı'
      });
    }

    const limitError = await participantLimitError(eventId);
    if (limitError) {
      return res.status(400).json({ success: false, error: limitError });
    }

    // Aynı telefon numarası ile kayıtlı kullanıcı var mı kontrol et
    const existingUser = await User.findOne({
      where: {
        phoneNumber: cleanPhone,
        eventId: eventId
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Bu telefon numarası ile zaten kayıtlı bir kullanıcı var'
      });
    }

    // Yeni kullanıcı oluştur
    const newUser = await User.create({
      phoneNumber: cleanPhone,
      eventId: eventId,
      firstName: firstName,
      lastName: lastName,
      email: email || null,
      role: 'participant',
      isActive: true
    });

    // Kullanıcıyı event bilgisi ile birlikte döndür
    const userWithEvent = await User.findByPk(newUser.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: Event,
        as: 'event',
        attributes: ['id', 'name', 'description', 'startDate', 'endDate', 'location', 'status', 'city', 'coverImage', 'logo', 'appLogo', 'introVideoUrl', 'introVideoFileName']
      }]
    });

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: userWithEvent.id, 
        email: userWithEvent.email,
        role: userWithEvent.role,
        eventId: userWithEvent.eventId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      token: token,
      user: userWithEvent,
      message: 'Kullanıcı başarıyla kaydedildi'
    });

  } catch (error) {
    console.error('Mobile registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Sunucu hatası'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin/Organizer or self)
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Update user request:', req.params.id, req.body);
    const { firstName, lastName, email, role, company, department, title, phone, phoneNumber, isActive, profileImage, password, preferences } = req.body;

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Direct SQL update method - most reliable
    const updateData = {};
    const updateFields = [];
    const updateValues = [];
    
    if (firstName !== undefined) {
      updateData.firstName = firstName;
      updateFields.push('first_name = ?');
      updateValues.push(firstName);
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
      updateFields.push('last_name = ?');
      updateValues.push(lastName);
    }
    if (email !== undefined) {
      updateData.email = email;
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (req.user.role === 'admin' && role !== undefined) {
      updateData.role = role;
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (company !== undefined) {
      updateData.company = company;
      updateFields.push('company = ?');
      updateValues.push(company);
    }
    if (department !== undefined) {
      updateData.department = department;
      updateFields.push('department = ?');
      updateValues.push(department);
    }
    if (title !== undefined) {
      updateData.title = title;
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (phone !== undefined) {
      updateData.phone = phone;
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber;
      updateFields.push('phone_number = ?');
      updateValues.push(phoneNumber);
    }
    if ((req.user.role === 'admin' || req.user.role === 'organizer') && isActive !== undefined) {
      updateData.isActive = isActive;
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
      updateFields.push('profile_image = ?');
      updateValues.push(profileImage);
    }
    if (preferences !== undefined && typeof preferences === 'object') {
      const merged = { ...(user.preferences || {}), ...preferences };
      updateData.preferences = merged;
      updateFields.push('preferences = ?');
      updateValues.push(JSON.stringify(merged));
    }
    // Şifre güncelleme - sadece admin yapabilir ve şifre gönderilmişse
    if (password !== undefined && password !== '' && req.user.role === 'admin') {
      // Şifreyi direkt hash'le ve kaydet
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // SQL ile direkt güncelle (hook'ları bypass et)
      await sequelize.query(
        'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
        {
          replacements: [hashedPassword, new Date().toISOString(), user.id],
          type: QueryTypes.UPDATE
        }
      );
      
      console.log('✅ Password updated for user:', user.id);
      
      // User instance'ı yeniden yükle
      await user.reload();
    }
    
    // Always update updated_at
    updateFields.push('updated_at = ?');
    updateValues.push(new Date().toISOString());
    
    console.log('🔧 Direct SQL update with data:', updateData);
    console.log('📝 Update fields:', updateFields);
    
    if (updateFields.length > 0) {
      const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      updateValues.push(user.id);
      
      console.log('🚀 Executing SQL:', sql);
      console.log('📊 Values:', updateValues);
      
      try {
        const [results] = await sequelize.query(sql, {
          replacements: updateValues,
          type: QueryTypes.UPDATE
        });
        
        console.log('✅ SQL update executed successfully');
        console.log('📈 Affected rows:', results);
        
        // Reload user to get updated data
        await user.reload();
        console.log('🔄 User reloaded:', user.toJSON());
        
      } catch (sqlError) {
        console.error('❌ SQL update error:', sqlError);
        throw sqlError;
      }
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/users/import
// @desc    Import users from Excel
// @access  Private (Admin/Organizer)
router.post('/import', auth, async (req, res) => {
  try {
    // Check if user is admin or organizer
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { users } = req.body;
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Users array is required'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    const baseDate = new Date();
    
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const rowNumber = i + 1;
      
      try {
        // Gerekli alanları kontrol et
        if (!userData.email || !userData.firstName || !userData.lastName) {
          results.errors.push({
            row: rowNumber,
            error: 'Email, Ad ve Soyad zorunludur'
          });
          continue;
        }

        // Email formatını kontrol et
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          results.errors.push({
            row: rowNumber,
            email: userData.email,
            error: 'Geçersiz email formatı'
          });
          continue;
        }

        // Mevcut kullanıcıyı kontrol et
        const existingUser = await User.findOne({
          where: { email: userData.email }
        });

        // Sıralama için createdAt'i ayarla (Excel'deki sıraya göre)
        const createdAtDate = new Date(baseDate.getTime() - (users.length - i) * 1000);

        if (existingUser) {
          // Güncelle
          await existingUser.update({
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber || userData.phone || existingUser.phoneNumber,
            company: userData.company || existingUser.company,
            department: userData.department || existingUser.department,
            title: userData.title || existingUser.title,
            role: userData.role || existingUser.role || 'participant',
            eventId: userData.eventId || existingUser.eventId,
            isActive: userData.isActive !== undefined ? userData.isActive : existingUser.isActive,
            createdAt: createdAtDate // Sıralamayı koru
          });
          results.updated++;
        } else {
          // Yeni oluştur
          await User.create({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber || userData.phone || null,
            phone: userData.phone || userData.phoneNumber || null,
            company: userData.company || null,
            department: userData.department || null,
            title: userData.title || null,
            role: userData.role || 'participant',
            eventId: userData.eventId || null,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            createdAt: createdAtDate // Sıralamayı koru
          });
          results.created++;
        }
      } catch (error) {
        console.error(`Error processing user row ${rowNumber}:`, error);
        results.errors.push({
          row: rowNumber,
          email: userData.email || 'N/A',
          error: error.message || 'Bilinmeyen hata'
        });
      }
    }

    res.json({
      success: true,
      message: `${results.created} kullanıcı oluşturuldu, ${results.updated} kullanıcı güncellendi`,
      results: results
    });
  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
