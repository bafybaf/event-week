const express = require('express');
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');
const Note = require('../models/Note');
const Event = require('../models/Event');
const User = require('../models/User');
const Program = require('../models/Program');

const router = express.Router();

// @route   GET /api/notes
// @desc    Get all notes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, userId, category, isPublic, isPinned, isArchived } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (category) whereClause.category = category;
    if (isPinned !== undefined) whereClause.isPinned = isPinned === 'true';
    if (isArchived !== undefined) whereClause.isArchived = isArchived === 'true';
    whereClause.isActive = true;

    const isStaff = req.user.role === 'admin' || req.user.role === 'organizer';
    if (isStaff) {
      if (userId) whereClause.userId = userId;
      if (isPublic !== undefined) whereClause.isPublic = isPublic === 'true';
    } else {
      whereClause[Op.or] = [
        { userId: req.user.id },
        { isPublic: true }
      ];
    }
    
    const notes = await Note.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Program,
          as: 'session',
          attributes: ['id', 'title', 'description']
        }
      ],
      order: [['isPinned', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      notes: notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/notes/:id
// @desc    Get note by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const noteId = req.params.id; // Note ID integer olabilir, string olarak al
    console.log('Fetching note with ID:', noteId);

    // Önce include olmadan deneyelim
    let note = await Note.findByPk(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // View count'u güvenli bir şekilde artır
    try {
      await note.increment('viewCount');
    } catch (incrementError) {
      console.warn('Could not increment viewCount:', incrementError.message);
      // View count hatası kritik değil, devam et
    }

    // Association'ları ayrı ayrı yükle
    try {
      const event = note.eventId ? await Event.findByPk(note.eventId, {
        attributes: ['id', 'name', 'description']
      }) : null;
      
      const user = note.userId ? await User.findByPk(note.userId, {
        attributes: ['id', 'firstName', 'lastName']
      }) : null;
      
      const session = note.sessionId ? await Program.findByPk(note.sessionId, {
        attributes: ['id', 'title', 'description']
      }) : null;

      const noteData = note.toJSON();
      noteData.event = event;
      noteData.user = user;
      noteData.session = session;

      res.json({
        success: true,
        note: noteData
      });
    } catch (includeError) {
      console.error('Error loading associations:', includeError);
      // Association'lar olmadan da döndür
      res.json({
        success: true,
        note: note.toJSON()
      });
    }
  } catch (error) {
    console.error('Get note error:', error);
    console.error('Error stack:', error.stack);
    if (error.parent) {
      console.error('SQL Error:', error.parent.message);
      console.error('SQL:', error.parent.sql);
    }
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/notes
// @desc    Create new note
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      category, 
      priority, 
      tags, 
      isPublic, 
      isPinned, 
      reminderDate, 
      eventId, 
      sessionId, 
      attachments, 
      notes
    } = req.body;

    if (!title || !content || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, içerik ve etkinlik alanları zorunludur'
      });
    }

    const noteData = {
      title,
      content,
      category: category || 'personal',
      priority: priority || 'medium',
      tags: tags || '',
      isPublic: isPublic || false,
      isPinned: isPinned || false,
      reminderDate: reminderDate || null,
      eventId,
      userId: req.user.id,
      sessionId: sessionId || null,
      attachments: attachments || '',
      notes: notes || ''
    };

    // Eğer createdAt veya updatedAt belirtilmişse ekle
    // Sequelize Date objesi olarak kabul eder ve otomatik formatlar
    if (req.body.createdAt) {
      // Boş string veya null kontrolü
      if (typeof req.body.createdAt === 'string' && req.body.createdAt.trim() === '') {
        // Boş string ise, createdAt'i ekleme (Sequelize otomatik set edecek)
      } else {
        const createdAtDate = new Date(req.body.createdAt);
        if (!isNaN(createdAtDate.getTime())) {
          noteData.createdAt = createdAtDate;
        }
      }
    }
    if (req.body.updatedAt) {
      // Boş string veya null kontrolü
      if (typeof req.body.updatedAt === 'string' && req.body.updatedAt.trim() === '') {
        // Boş string ise, updatedAt'i ekleme (Sequelize otomatik set edecek)
      } else {
        const updatedAtDate = new Date(req.body.updatedAt);
        if (!isNaN(updatedAtDate.getTime())) {
          noteData.updatedAt = updatedAtDate;
        }
      }
    }

    const note = await Note.create(noteData);
    
    // Association'ları ayrı ayrı yükle (include hataları olabilir)
    try {
      const event = note.eventId ? await Event.findByPk(String(note.eventId), {
        attributes: ['id', 'name', 'description']
      }) : null;
      
      const user = note.userId ? await User.findByPk(String(note.userId), {
        attributes: ['id', 'firstName', 'lastName']
      }) : null;
      
      const session = note.sessionId ? await Program.findByPk(String(note.sessionId), {
        attributes: ['id', 'title', 'description']
      }) : null;

      const createdNoteData = note.toJSON();
      createdNoteData.event = event;
      createdNoteData.user = user;
      createdNoteData.session = session;

      res.status(201).json({
        success: true,
        note: createdNoteData,
        message: 'Not başarıyla oluşturuldu'
      });
    } catch (includeError) {
      console.warn('Warning: Could not load associations:', includeError.message);
      // Association'lar olmadan da döndür
      res.status(201).json({
        success: true,
        note: note.toJSON(),
        message: 'Not başarıyla oluşturuldu'
      });
    }

  } catch (error) {
    console.error('Create note error:', error);
    console.error('Error stack:', error.stack);
    if (error.parent) {
      console.error('SQL Error:', error.parent.message);
      console.error('SQL:', error.parent.sql);
    }
    res.status(500).json({
      success: false,
      error: 'Not oluşturulurken bir hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update note
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check if user can update this note
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' && note.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const updateData = { ...req.body };
    
    // createdAt ve updatedAt'i Date objelerine çevir ve doğru formatla
    if (updateData.createdAt) {
      // Boş string veya null kontrolü
      if (typeof updateData.createdAt === 'string' && updateData.createdAt.trim() === '') {
        delete updateData.createdAt;
      } else {
        const createdAtDate = new Date(updateData.createdAt);
        if (!isNaN(createdAtDate.getTime())) {
          // SQLite için Date objesi olarak set et (Sequelize otomatik formatlar)
          updateData.createdAt = createdAtDate;
        } else {
          delete updateData.createdAt; // Geçersiz tarih ise sil
        }
      }
    }
    
    if (updateData.updatedAt) {
      // Boş string veya null kontrolü
      if (typeof updateData.updatedAt === 'string' && updateData.updatedAt.trim() === '') {
        delete updateData.updatedAt;
      } else {
        const updatedAtDate = new Date(updateData.updatedAt);
        if (!isNaN(updatedAtDate.getTime())) {
          // SQLite için Date objesi olarak set et (Sequelize otomatik formatlar)
          updateData.updatedAt = updatedAtDate;
        } else {
          delete updateData.updatedAt; // Geçersiz tarih ise sil
        }
      }
    }
    
    // Eğer manuel updatedAt veya createdAt set edildiyse, Sequelize'in otomatik güncellemesini override et
    if (updateData.updatedAt || updateData.createdAt) {
      // Manuel tarih set edildi, önce tarihleri set et
      const timestampFields = {};
      if (updateData.createdAt) {
        timestampFields.createdAt = updateData.createdAt;
        delete updateData.createdAt;
      }
      if (updateData.updatedAt) {
        timestampFields.updatedAt = updateData.updatedAt;
        delete updateData.updatedAt;
      }
      
      // Önce diğer alanları güncelle (eğer varsa)
      if (Object.keys(updateData).length > 0) {
        await note.update(updateData);
      }
      
      // Sonra tarihleri manuel olarak raw SQL ile güncelle
      // Bu sayede Sequelize'in otomatik timestamp güncellemesi yapılmaz
      const updateFields = [];
      const replacements = { noteId: note.id };
      
      if (timestampFields.createdAt) {
        // SQLite için DATETIME formatı: YYYY-MM-DD HH:mm:ss
        const createdAtStr = timestampFields.createdAt instanceof Date 
          ? timestampFields.createdAt.toISOString().replace('T', ' ').slice(0, 19)
          : timestampFields.createdAt;
        updateFields.push('created_at = :createdAt');
        replacements.createdAt = createdAtStr;
      }
      if (timestampFields.updatedAt) {
        // SQLite için DATETIME formatı: YYYY-MM-DD HH:mm:ss
        const updatedAtStr = timestampFields.updatedAt instanceof Date 
          ? timestampFields.updatedAt.toISOString().replace('T', ' ').slice(0, 19)
          : timestampFields.updatedAt;
        updateFields.push('updated_at = :updatedAt');
        replacements.updatedAt = updatedAtStr;
      }
      
      if (updateFields.length > 0) {
        await sequelize.query(
          `UPDATE notes SET ${updateFields.join(', ')} WHERE id = :noteId`,
          {
            replacements,
            type: QueryTypes.UPDATE
          }
        );
      }
    } else {
      // Manuel tarih yok, Sequelize otomatik güncellesin
      await note.update(updateData);
    }
    
    // Notu yeniden yükle (güncellenmiş tarihleri görmek için)
    await note.reload();
    
    // Association'ları ayrı ayrı yükle
    try {
      const event = note.eventId ? await Event.findByPk(String(note.eventId), {
        attributes: ['id', 'name', 'description']
      }) : null;
      
      const user = note.userId ? await User.findByPk(String(note.userId), {
        attributes: ['id', 'firstName', 'lastName']
      }) : null;
      
      const session = note.sessionId ? await Program.findByPk(String(note.sessionId), {
        attributes: ['id', 'title', 'description']
      }) : null;

      const updatedNoteData = note.toJSON();
      updatedNoteData.event = event;
      updatedNoteData.user = user;
      updatedNoteData.session = session;

      res.json({
        success: true,
        note: updatedNoteData,
        message: 'Not başarıyla güncellendi'
      });
    } catch (includeError) {
      console.warn('Warning: Could not load associations:', includeError.message);
      // Association'lar olmadan da döndür
      res.json({
        success: true,
        note: note.toJSON(),
        message: 'Not başarıyla güncellendi'
      });
    }
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      error: 'Not güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Delete note
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Check if user can delete this note
    if (req.user.role !== 'admin' && req.user.role !== 'organizer' && note.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await note.destroy();

    res.json({
      success: true,
      message: 'Not başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;