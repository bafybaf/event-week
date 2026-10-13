const express = require('express');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');
// Import models from index to ensure associations are initialized
const { Program, Speaker, ProgramSpeaker, User } = require('../models');
const { notifyEvent } = require('../services/notify');
const router = express.Router();

const ensureProgramPdfColumns = async () => {
  try {
    const [cols] = await sequelize.query('PRAGMA table_info(programs)');
    const names = (cols || []).map((c) => c.name);
    if (!names.includes('pdf_url')) {
      await sequelize.query('ALTER TABLE programs ADD COLUMN pdf_url TEXT');
    }
    if (!names.includes('file_name')) {
      await sequelize.query('ALTER TABLE programs ADD COLUMN file_name TEXT');
    }
    if (!names.includes('file_size')) {
      await sequelize.query('ALTER TABLE programs ADD COLUMN file_size INTEGER');
    }
  } catch (error) {
    console.warn('Program PDF columns ensure:', error.message);
  }
};
ensureProgramPdfColumns();

// List programs (optional filter by eventId)
router.get('/', async (req, res) => {
  try {
    const { eventId } = req.query;
    const where = eventId ? { eventId: String(eventId) } : {};
    
    // Get programs without speakers first to avoid association errors
    const programs = await Program.findAll({ 
      where, 
      order: [['startTime', 'ASC']]
    });
    
    // Try to add speakers and participants manually for each program using raw query to avoid association issues
    const programsWithSpeakers = await Promise.all(
      programs.map(async (program) => {
        try {
          // Use raw query to get speakers
          // SQLite with underscored: true converts camelCase to snake_case
          const { sequelize } = require('../models');
          const { QueryTypes } = require('sequelize');
          const results = await sequelize.query(`
            SELECT s.id, s.first_name as "firstName", s.last_name as "lastName", 
                   s.title, s.company, s.profile_image as "profileImage"
            FROM program_speakers ps
            JOIN speakers s ON ps.speaker_id = s.id
            WHERE ps.program_id = :programId
          `, {
            replacements: { programId: program.id },
            type: QueryTypes.SELECT
          });
          
          // Calculate participant count from event users
          let participantCount = 0;
          try {
            participantCount = await User.count({
              where: { eventId: program.eventId }
            });
            
            // Update program's currentAttendance if different
            if (program.currentAttendance !== participantCount) {
              await program.update({ currentAttendance: participantCount });
            }
          } catch (participantError) {
            console.warn(`Warning: Could not calculate participants for program ${program.id}:`, participantError.message);
          }
          
          const programData = program.toJSON();
          programData.speakers = Array.isArray(results) ? results : [];
          programData.currentAttendance = participantCount;
          return programData;
        } catch (speakerError) {
          console.warn(`Warning: Could not load speakers for program ${program.id}:`, speakerError.message);
          const programData = program.toJSON();
          programData.speakers = [];
          return programData;
        }
      })
    );
    
    res.json({ success: true, programs: programsWithSpeakers });
  } catch (error) {
    console.error('Get programs error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch programs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get program participants
// NOTE: This route must come BEFORE /:id route to avoid route conflicts
router.get('/:id/participants', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    // Get participants from the event (all users registered to the event)
    const participants = await User.findAll({
      where: { eventId: program.eventId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'role', 'company', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      participants: participants,
      count: participants.length
    });
  } catch (error) {
    console.error('Get program participants error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get single program
router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    
    // Try to add speakers manually using raw query
    try {
      const { sequelize } = require('../models');
      const { QueryTypes } = require('sequelize');
      const results = await sequelize.query(`
        SELECT s.id, s.first_name as "firstName", s.last_name as "lastName", 
               s.title, s.company, s.profile_image as "profileImage"
        FROM program_speakers ps
        JOIN speakers s ON ps.speaker_id = s.id
        WHERE ps.program_id = :programId
      `, {
        replacements: { programId: program.id },
        type: QueryTypes.SELECT
      });
      
      const programData = program.toJSON();
      programData.speakers = Array.isArray(results) ? results : [];
      res.json({ success: true, program: programData });
    } catch (speakerError) {
      console.warn('Warning: Could not load speakers:', speakerError.message);
      const programData = program.toJSON();
      programData.speakers = [];
      res.json({ success: true, program: programData });
    }
  } catch (error) {
    console.error('Get program error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch program',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create program
router.post('/', async (req, res) => {
  try {
    console.log('Create program request body:', req.body);
    // Accept both admin UI payload (date + times) and ISO datetimes
    const {
      eventId,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      room,
      type,
      status,
      capacity,
      maxCapacity,
      isRegistrationRequired,
      isVotingEnabled,
      votingQuestion,
      votingOptions,
      votingType,
      materials,
      notes,
      speakerIds,
      pdfUrl,
      fileName,
      fileSize
    } = req.body;

    if (!title && !pdfUrl) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    if (!eventId) {
      return res.status(400).json({ success: false, error: 'EventId is required' });
    }

    // Build start/end
    let startDateTime = req.body.startDateTime;
    let endDateTime = req.body.endDateTime;
    
    // If startTime and endTime are already ISO strings, use them directly
    if (startTime && !startDateTime) {
      if (typeof startTime === 'string' && startTime.includes('T')) {
        // Already an ISO datetime string
        startDateTime = new Date(startTime);
      } else if (date && startTime) {
        // Combine date and time
        startDateTime = new Date(`${date}T${startTime}:00`);
      }
    }
    
    if (endTime && !endDateTime) {
      if (typeof endTime === 'string' && endTime.includes('T')) {
        // Already an ISO datetime string
        endDateTime = new Date(endTime);
      } else if (date && endTime) {
        // Combine date and time
        endDateTime = new Date(`${date}T${endTime}:00`);
      }
    }

    if ((!startDateTime || !endDateTime) && pdfUrl) {
      const now = new Date();
      startDateTime = now;
      endDateTime = now;
    }

    if (!startDateTime || !endDateTime) {
      console.error('Missing startTime or endTime:', { startDateTime, endDateTime, date, startTime, endTime });
      return res.status(400).json({ success: false, error: 'Start and end time are required' });
    }

    const resolvedEventId = String(eventId);

    console.log('Creating program with data:', {
      eventId: resolvedEventId,
      title,
      startTime: startDateTime,
      endTime: endDateTime
    });

    const created = await Program.create({
      eventId: resolvedEventId,
      title,
      description: description || '',
      startTime: startDateTime,
      endTime: endDateTime,
      location: location || '',
      room: room || '',
      type: type || 'presentation',
      status: status || 'scheduled',
      maxCapacity: maxCapacity ?? capacity ?? null,
      currentAttendance: 0,
      isRegistrationRequired: !!isRegistrationRequired,
      isVotingEnabled: !!isVotingEnabled,
      votingQuestion: votingQuestion || null,
      votingOptions: votingOptions || null,
      votingType: votingType || 'single',
      materials: materials || null,
      notes: notes || null,
      pdfUrl: pdfUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null
    });

    // Add program speakers if speakerIds provided
    if (speakerIds && Array.isArray(speakerIds) && speakerIds.length > 0) {
      const validSpeakerIds = speakerIds.filter(id => id && id.trim() !== '');
      if (validSpeakerIds.length > 0) {
        const existingSpeakers = await Speaker.findAll({
          where: { id: { [Op.in]: validSpeakerIds } }
        });
        
        const existingSpeakerIds = existingSpeakers.map(s => s.id);
        
        await ProgramSpeaker.bulkCreate(
          existingSpeakerIds.map(speakerId => ({
            programId: created.id,
            speakerId: speakerId
          }))
        );
      }
    }

    // Reload program with speakers if association exists
    try {
      if (Program.associations && Program.associations.speakers) {
        await created.reload({
          include: [{
            model: Speaker,
            as: 'speakers',
            attributes: ['id', 'firstName', 'lastName', 'title', 'company', 'profileImage'],
            through: { attributes: [] },
            required: false
          }]
        });
      }
    } catch (reloadError) {
      console.warn('Warning: Could not reload program with speakers:', reloadError.message);
    }

    console.log('Program created successfully:', created.id);

    if (created.isVotingEnabled) {
      notifyEvent(created.eventId, {
        title: 'Yeni oylama',
        body: created.votingQuestion || `${created.title} için oylama açıldı.`,
        data: {
          type: 'voting',
          screen: '/voting',
          programId: created.id,
        },
        priority: 'high',
      });
    }

    res.status(201).json({ success: true, program: created });
  } catch (error) {
    console.error('Create program error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to create program',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update program
router.put('/:id', async (req, res) => {
  try {
    console.log('PUT /api/programs/:id called with id:', req.params.id);
    console.log('Request body:', req.body);
    
    const program = await Program.findByPk(req.params.id);
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    const wasVotingEnabled = !!program.isVotingEnabled;

    const {
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      room,
      type,
      status,
      capacity,
      maxCapacity,
      isRegistrationRequired,
      isVotingEnabled,
      votingQuestion,
      votingOptions,
      votingType,
      materials,
      notes,
      speakerIds,
      eventId,
      pdfUrl,
      fileName,
      fileSize
    } = req.body;

    // Handle date/time parsing - support both separate date/time and combined datetime
    let startDateTime = req.body.startDateTime || req.body.startTime;
    let endDateTime = req.body.endDateTime || req.body.endTime;
    
    if (!startDateTime && date && startTime) {
      startDateTime = `${date}T${startTime}`;
    }
    if (!endDateTime && date && endTime) {
      endDateTime = `${date}T${endTime}`;
    }
    
    // Ensure dates are in ISO format and parse to Date objects
    if (startDateTime && typeof startDateTime === 'string') {
      try {
        const parsedStart = new Date(startDateTime);
        if (isNaN(parsedStart.getTime())) {
          console.error('Invalid startDateTime:', startDateTime);
          return res.status(400).json({ 
            success: false, 
            error: 'Geçersiz başlangıç tarihi/saat formatı',
            details: process.env.NODE_ENV === 'development' ? `Invalid date: ${startDateTime}` : undefined
          });
        }
        startDateTime = parsedStart;
      } catch (e) {
        console.error('Error parsing startDateTime:', e);
        return res.status(400).json({ 
          success: false, 
          error: 'Başlangıç tarihi/saati parse edilemedi',
          details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
      }
    }
    
    if (endDateTime && typeof endDateTime === 'string') {
      try {
        const parsedEnd = new Date(endDateTime);
        if (isNaN(parsedEnd.getTime())) {
          console.error('Invalid endDateTime:', endDateTime);
          return res.status(400).json({ 
            success: false, 
            error: 'Geçersiz bitiş tarihi/saat formatı',
            details: process.env.NODE_ENV === 'development' ? `Invalid date: ${endDateTime}` : undefined
          });
        }
        endDateTime = parsedEnd;
      } catch (e) {
        console.error('Error parsing endDateTime:', e);
        return res.status(400).json({ 
          success: false, 
          error: 'Bitiş tarihi/saati parse edilemedi',
          details: process.env.NODE_ENV === 'development' ? e.message : undefined
        });
      }
    }
    
    console.log('Parsed startDateTime:', startDateTime, 'Type:', typeof startDateTime);
    console.log('Parsed endDateTime:', endDateTime, 'Type:', typeof endDateTime);

    const updateData = {};
    
    // Only update fields that are provided (not undefined)
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || '';
    if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl || null;
    if (fileName !== undefined) updateData.fileName = fileName || null;
    if (fileSize !== undefined) updateData.fileSize = fileSize || null;
    if (location !== undefined) updateData.location = location || '';
    if (room !== undefined) updateData.room = room || '';
    if (type !== undefined) updateData.type = type || 'presentation';
    if (status !== undefined) updateData.status = status || 'scheduled';
    if (maxCapacity !== undefined || capacity !== undefined) {
      updateData.maxCapacity = maxCapacity ?? capacity ?? 0;
    }
    if (isRegistrationRequired !== undefined) {
      updateData.isRegistrationRequired = !!isRegistrationRequired;
    }
    if (isVotingEnabled !== undefined) {
      updateData.isVotingEnabled = !!isVotingEnabled;
    }
    if (votingQuestion !== undefined) updateData.votingQuestion = votingQuestion || null;
    if (votingType !== undefined) updateData.votingType = votingType || 'single';
    if (votingOptions !== undefined) {
      // votingOptions is a TEXT field with JSON getter/setter in the model
      // Model setter already handles JSON.stringify, so pass the value directly
      // If it's already a string (from previous saves), keep it as is
      // If it's an array/object, pass it directly - model will stringify it
      if (typeof votingOptions === 'string') {
        // If it's already a string, check if it's valid JSON
        try {
          JSON.parse(votingOptions);
          updateData.votingOptions = votingOptions; // Already valid JSON string
        } catch {
          // Invalid JSON string, treat as plain string (shouldn't happen but handle it)
          updateData.votingOptions = votingOptions;
        }
      } else if (Array.isArray(votingOptions)) {
        // Pass array directly - model setter will stringify it
        updateData.votingOptions = votingOptions;
      } else if (votingOptions === null || votingOptions === undefined) {
        updateData.votingOptions = null;
      } else {
        // Other types, pass as is - model will handle it
        updateData.votingOptions = votingOptions;
      }
    }
    if (materials !== undefined) {
      // materials is a TEXT field with JSON getter/setter, so stringify if it's an array/object
      if (Array.isArray(materials) || typeof materials === 'object') {
        updateData.materials = JSON.stringify(materials);
      } else {
        updateData.materials = materials || null;
      }
    }
    if (notes !== undefined) updateData.notes = notes || null;
    
    // Handle startTime/endTime - only update if provided and valid
    if (startDateTime) {
      // Ensure it's a Date object or valid date string
      if (startDateTime instanceof Date) {
        updateData.startTime = startDateTime;
      } else if (typeof startDateTime === 'string') {
        const parsed = new Date(startDateTime);
        if (!isNaN(parsed.getTime())) {
          updateData.startTime = parsed;
        } else {
          console.error('Invalid startDateTime format:', startDateTime);
          return res.status(400).json({ 
            success: false, 
            error: 'Geçersiz başlangıç tarihi/saat formatı',
            details: process.env.NODE_ENV === 'development' ? `Invalid date: ${startDateTime}` : undefined
          });
        }
      }
    }
    
    if (endDateTime) {
      // Ensure it's a Date object or valid date string
      if (endDateTime instanceof Date) {
        updateData.endTime = endDateTime;
      } else if (typeof endDateTime === 'string') {
        const parsed = new Date(endDateTime);
        if (!isNaN(parsed.getTime())) {
          updateData.endTime = parsed;
        } else {
          console.error('Invalid endDateTime format:', endDateTime);
          return res.status(400).json({ 
            success: false, 
            error: 'Geçersiz bitiş tarihi/saat formatı',
            details: process.env.NODE_ENV === 'development' ? `Invalid date: ${endDateTime}` : undefined
          });
        }
      }
    }
    
    // Only update eventId if provided (usually shouldn't change, but handle it)
    if (eventId) {
      updateData.eventId = String(eventId);
    }
    
    // Create a safe copy for logging (convert Dates to strings)
    const logData = { ...updateData };
    if (logData.startTime instanceof Date) logData.startTime = logData.startTime.toISOString();
    if (logData.endTime instanceof Date) logData.endTime = logData.endTime.toISOString();
    
    console.log('Updating program with data:', JSON.stringify(logData, null, 2));
    console.log('Update data keys:', Object.keys(updateData));
    
    if (Object.keys(updateData).length > 0) {
      try {
        console.log('Attempting to update program...');
        console.log('startTime value:', updateData.startTime, 'Type:', typeof updateData.startTime, 'Is Date:', updateData.startTime instanceof Date);
        console.log('endTime value:', updateData.endTime, 'Type:', typeof updateData.endTime, 'Is Date:', updateData.endTime instanceof Date);
        await program.update(updateData);
        console.log('Program update successful');
      } catch (updateError) {
        console.error('Error during program.update():', updateError);
        console.error('Update error message:', updateError.message);
        console.error('Update error name:', updateError.name);
        console.error('Update error stack:', updateError.stack);
        if (updateError.parent) {
          console.error('Update error parent:', updateError.parent.message);
          console.error('Update error SQL:', updateError.parent.sql);
        }
        console.error('Update data that caused error:', JSON.stringify(updateData, null, 2));
        throw updateError; // Re-throw to be caught by outer catch
      }
    } else {
      console.warn('No data to update');
    }

    // Update program speakers if speakerIds provided
    if (speakerIds !== undefined) {
      console.log('Updating program speakers, speakerIds:', speakerIds, 'Type:', typeof speakerIds, 'Is Array:', Array.isArray(speakerIds));
      try {
        // Remove all existing speaker associations
        const deleteResult = await ProgramSpeaker.destroy({ where: { programId: program.id } });
        console.log('Deleted existing speaker associations:', deleteResult);
        
        // Add new speaker associations
        if (Array.isArray(speakerIds) && speakerIds.length > 0) {
          // Filter out empty strings, null, undefined and ensure all IDs are valid strings
          const validSpeakerIds = speakerIds
            .filter(id => id != null && id !== '' && String(id).trim() !== '')
            .map(id => String(id).trim());
          
          console.log('Valid speaker IDs after filtering:', validSpeakerIds);
          
          if (validSpeakerIds.length > 0) {
            // Verify speakers exist
            const existingSpeakers = await Speaker.findAll({
              where: { id: { [Op.in]: validSpeakerIds } }
            });
            
            const existingSpeakerIds = existingSpeakers.map(s => String(s.id));
            console.log('Existing speaker IDs found:', existingSpeakerIds);
            
            if (existingSpeakerIds.length > 0) {
              // Create associations
              const associationData = existingSpeakerIds.map(speakerId => ({
                programId: String(program.id),
                speakerId: String(speakerId)
              }));
              console.log('Creating speaker associations:', associationData);
              await ProgramSpeaker.bulkCreate(associationData);
              console.log('Program speakers updated successfully');
            } else {
              console.warn('No valid speakers found for provided IDs');
            }
          } else {
            console.log('No valid speaker IDs to process');
          }
        } else {
          console.log('speakerIds is not an array or is empty, no speakers to associate');
        }
      } catch (speakerError) {
        console.error('Error updating program speakers:', speakerError);
        console.error('Speaker error message:', speakerError.message);
        console.error('Speaker error stack:', speakerError.stack);
        // Don't fail the entire update if speaker association fails
      }
    } else {
      console.log('speakerIds is undefined, skipping speaker update');
    }

    // Try to get speakers using raw query (more reliable than associations)
    try {
      const { sequelize } = require('../models');
      const { QueryTypes } = require('sequelize');
      const speakerResults = await sequelize.query(`
        SELECT s.id, s.first_name as "firstName", s.last_name as "lastName", 
               s.title, s.company, s.profile_image as "profileImage"
        FROM program_speakers ps
        JOIN speakers s ON ps.speaker_id = s.id
        WHERE ps.program_id = :programId
      `, {
        replacements: { programId: program.id },
        type: QueryTypes.SELECT
      });
      
      const programData = program.toJSON();
      programData.speakers = Array.isArray(speakerResults) ? speakerResults : [];
      
      console.log('Program updated successfully with speakers:', programData.speakers.length);

      if (!wasVotingEnabled && !!program.isVotingEnabled) {
        notifyEvent(program.eventId, {
          title: 'Yeni oylama',
          body: program.votingQuestion || `${program.title} için oylama açıldı.`,
          data: {
            type: 'voting',
            screen: '/voting',
            programId: program.id,
          },
          priority: 'high',
        });
      }

      res.json({ success: true, program: programData });
    } catch (reloadError) {
      console.warn('Warning: Could not load speakers after update:', reloadError.message);
      const programData = program.toJSON();
      programData.speakers = [];

      if (!wasVotingEnabled && !!program.isVotingEnabled) {
        notifyEvent(program.eventId, {
          title: 'Yeni oylama',
          body: program.votingQuestion || `${program.title} için oylama açıldı.`,
          data: {
            type: 'voting',
            screen: '/voting',
            programId: program.id,
          },
          priority: 'high',
        });
      }

      res.json({ success: true, program: programData });
    }
  } catch (error) {
    console.error('Update program error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      parent: error.parent?.message
    });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update program',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete program
router.delete('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    // İlişkili kayıtları sil (foreign key constraint hatalarını önlemek için)
    const { sequelize } = require('../models');
    const { QueryTypes } = require('sequelize');
    const programId = program.id;

    try {
      // Program speakers ilişkilerini sil
      await sequelize.query(
        'DELETE FROM program_speakers WHERE program_id = :programId',
        {
          replacements: { programId },
          type: QueryTypes.DELETE
        }
      );

      // Oyları sil (eğer votings tablosu varsa)
      // SQLite'de field adı program_id olabilir (underscored: true)
      try {
        // Önce program_id ile dene (SQLite snake_case)
        await sequelize.query(
          'DELETE FROM votings WHERE program_id = :programId',
          {
            replacements: { programId },
            type: QueryTypes.DELETE
          }
        );
      } catch (votesError) {
        // program_id başarısız olursa programId ile dene
        try {
          await sequelize.query(
            'DELETE FROM votings WHERE programId = :programId',
            {
              replacements: { programId },
              type: QueryTypes.DELETE
            }
          );
        } catch (votesError2) {
          // Votings tablosu yoksa veya hata varsa devam et
          console.log('Votings deletion skipped or failed:', votesError2.message || votesError.message);
        }
      }

      // Notes tablosundaki program referanslarını temizle (sessionId)
      try {
        await sequelize.query(
          'UPDATE notes SET session_id = NULL WHERE session_id = :programId',
          {
            replacements: { programId },
            type: QueryTypes.UPDATE
          }
        );
      } catch (notesError) {
        // Notes güncelleme hatası varsa devam et
        console.log('Notes update skipped or failed:', notesError.message);
      }

      // Program'ı sil
      await program.destroy();
      
      res.json({ success: true, message: 'Program başarıyla silindi' });
    } catch (deleteError) {
      console.error('Delete program related data error:', deleteError);
      console.error('Error details:', {
        message: deleteError.message,
        name: deleteError.name,
        parent: deleteError.parent?.message,
        sql: deleteError.sql
      });
      
      // Hata durumunda yine de program'ı silmeyi dene (cascade delete varsa)
      try {
        await program.destroy({ force: true });
        res.json({ success: true, message: 'Program silindi (bazı ilişkili kayıtlar silinemedi)' });
      } catch (forceDeleteError) {
        throw deleteError; // Orijinal hatayı fırlat
      }
    }
  } catch (error) {
    console.error('Delete program error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      parent: error.parent?.message,
      sql: error.sql,
      constraint: error.parent?.constraint
    });
    
    // Foreign key constraint hatası için özel mesaj
    if (error.parent?.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || 
        error.parent?.code === '23503' || // PostgreSQL foreign key constraint
        error.message?.includes('FOREIGN KEY constraint')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bu program silinemez çünkü ilişkili kayıtlar var. Önce ilişkili kayıtları siliniz.' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Program silinemedi',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
