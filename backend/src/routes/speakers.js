const express = require('express');
const { auth } = require('../middleware/auth');
const Speaker = require('../models/Speaker');
const Event = require('../models/Event');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/speakers
// @desc    Get all speakers
// @access  Private or Public (for mobile)
router.get('/', async (req, res) => {
  try {
    const { eventId, isKeynote, isAvailable } = req.query;
    
    console.log('GET /api/speakers called with query:', req.query);
    console.log('eventId from query:', eventId, 'Type:', typeof eventId);
    
    let whereClause = {};
    
    if (eventId) {
      // Convert to string for SQLite compatibility
      const resolvedEventId = String(eventId);
      whereClause.eventId = resolvedEventId;
      console.log('Filtering by eventId:', resolvedEventId, 'Type:', typeof resolvedEventId);
      
      // Also try to find speakers without eventId filter to debug
      const allSpeakers = await Speaker.findAll({ limit: 5 });
      console.log('Sample speakers (first 5) for debugging:', allSpeakers.map(s => ({
        id: s.id,
        eventId: s.eventId,
        eventIdType: typeof s.eventId,
        firstName: s.firstName,
        lastName: s.lastName
      })));
    }
    if (isKeynote !== undefined) whereClause.isKeynote = isKeynote === 'true';
    if (isAvailable !== undefined) whereClause.isAvailable = isAvailable === 'true';
    
    console.log('Where clause:', whereClause);
    console.log('Where clause JSON:', JSON.stringify(whereClause));
    
    // Get speakers without includes to avoid association errors
    const speakers = await Speaker.findAll({
      where: whereClause,
      order: [['isKeynote', 'DESC'], ['createdAt', 'DESC']]
    });

    console.log(`Found ${speakers.length} speakers`);
    if (speakers.length > 0) {
      console.log('First speaker sample:', {
        id: speakers[0].id,
        eventId: speakers[0].eventId,
        firstName: speakers[0].firstName,
        lastName: speakers[0].lastName
      });
    }

    // Convert to plain objects to avoid Sequelize issues
    const speakersData = speakers.map(s => s.toJSON());

    res.json({
      success: true,
      speakers: speakersData
    });
  } catch (error) {
    console.error('Get speakers error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/speakers/:id
// @desc    Get speaker by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const speaker = await Speaker.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    if (!speaker) {
      return res.status(404).json({
        success: false,
        error: 'Speaker not found'
      });
    }

    res.json({
      success: true,
      speaker: speaker
    });
  } catch (error) {
    console.error('Get speaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/speakers
// @desc    Create new speaker
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    console.log('POST /api/speakers called with body:', req.body);

    const {
      userId,
      eventId,
      firstName,
      lastName,
      title,
      company,
      bio,
      profileImage,
      email,
      phone,
      website,
      linkedin,
      twitter,
      expertise,
      languages,
      isKeynote,
      isAvailable
    } = req.body;

    if (!firstName || !lastName || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Ad, soyad ve etkinlik alanları zorunludur'
      });
    }

    // Ensure eventId is a string for SQLite compatibility
    const resolvedEventId = String(eventId);

    const speakerData = {
      userId: userId || null,
      eventId: resolvedEventId,
      firstName,
      lastName,
      title: title || '',
      company: company || '',
      bio: bio || '',
      profileImage: profileImage || '',
      email: email || '',
      phone: phone || '',
      website: website || '',
      linkedin: linkedin || '',
      twitter: twitter || '',
      expertise: expertise || [],
      languages: languages || [],
      isKeynote: isKeynote || false,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    };

    console.log('Creating speaker with data:', speakerData);

    const speaker = await Speaker.create(speakerData);
    
    // Return the created speaker without includes to avoid association errors
    // The frontend can fetch the speaker separately if needed
    const createdSpeaker = await Speaker.findByPk(speaker.id);

    console.log('Speaker created successfully:', createdSpeaker.id);

    res.status(201).json({
      success: true,
      speaker: createdSpeaker,
      message: 'Konuşmacı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create speaker error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      parent: error.parent?.message
    });
    res.status(500).json({
      success: false,
      error: 'Konuşmacı oluşturulurken bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/speakers/import
// @desc    Import speakers from Excel
// @access  Private (Admin/Organizer)
router.post('/import', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { speakers, eventId: defaultEventId } = req.body;
    if (!Array.isArray(speakers) || speakers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Speakers array is required'
      });
    }

    const parseList = (value) => {
      if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
      if (!value) return [];
      return String(value).split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
    };

    const parseBool = (value, fallback = false) => {
      if (value === undefined || value === null || value === '') return fallback;
      const text = String(value).trim().toLowerCase();
      return ['true', '1', 'evet', 'yes', 'aktif', 'active', 'ana konuşmacı', 'ana konusmaci'].includes(text);
    };

    const results = { created: 0, updated: 0, errors: [] };

    for (let i = 0; i < speakers.length; i++) {
      const row = speakers[i] || {};
      const rowNumber = i + 1;
      try {
        const firstName = String(row.firstName || '').trim();
        const lastName = String(row.lastName || '').trim();
        const eventId = String(row.eventId || defaultEventId || '').trim();
        const email = String(row.email || '').trim();

        if (!firstName || !lastName) {
          results.errors.push({ row: rowNumber, error: 'Ad ve soyad zorunludur' });
          continue;
        }
        if (firstName.length < 2 || lastName.length < 2) {
          results.errors.push({ row: rowNumber, error: 'Ad ve soyad en az 2 karakter olmalı' });
          continue;
        }
        if (!eventId) {
          results.errors.push({ row: rowNumber, error: 'Etkinlik ID zorunludur' });
          continue;
        }
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            results.errors.push({ row: rowNumber, email, error: 'Geçersiz e-posta' });
            continue;
          }
        }

        const payload = {
          eventId,
          firstName,
          lastName,
          title: String(row.title || '').trim(),
          company: String(row.company || '').trim(),
          bio: String(row.bio || '').trim(),
          email: email || '',
          phone: String(row.phone || row.phoneNumber || '').trim(),
          website: String(row.website || '').trim(),
          linkedin: String(row.linkedin || '').trim(),
          twitter: String(row.twitter || '').trim(),
          expertise: parseList(row.expertise),
          isKeynote: parseBool(row.isKeynote, false),
          isAvailable: row.isAvailable !== undefined
            ? parseBool(row.isAvailable, true)
            : !['pasif', 'inactive', 'hayır', 'hayir', 'no', 'false', '0'].includes(String(row.status || '').trim().toLowerCase())
        };

        let existing = null;
        if (email) {
          existing = await Speaker.findOne({ where: { email, eventId } });
        }
        if (!existing) {
          existing = await Speaker.findOne({
            where: { firstName, lastName, eventId }
          });
        }

        if (existing) {
          await existing.update(payload);
          results.updated += 1;
        } else {
          await Speaker.create(payload);
          results.created += 1;
        }
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          email: row.email || 'N/A',
          error: error.message || 'Bilinmeyen hata'
        });
      }
    }

    res.json({
      success: true,
      message: `${results.created} konuşmacı eklendi, ${results.updated} konuşmacı güncellendi`,
      results
    });
  } catch (error) {
    console.error('Import speakers error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   PUT /api/speakers/:id
// @desc    Update speaker
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const speaker = await Speaker.findByPk(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        error: 'Speaker not found'
      });
    }

    const updateData = req.body;
    await speaker.update(updateData);
    
    await speaker.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      speaker: speaker,
      message: 'Konuşmacı başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update speaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Konuşmacı güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/speakers/:id
// @desc    Delete speaker
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const speaker = await Speaker.findByPk(req.params.id);
    if (!speaker) {
      return res.status(404).json({
        success: false,
        error: 'Speaker not found'
      });
    }

    await speaker.destroy();

    res.json({
      success: true,
      message: 'Konuşmacı başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete speaker error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
