const express = require('express');
const { auth } = require('../middleware/auth');
const Survey = require('../models/Survey');
const SurveyResponse = require('../models/SurveyResponse');
const Event = require('../models/Event');
const User = require('../models/User');
const Program = require('../models/Program');
const { notifyEvent } = require('../services/notify');

const router = express.Router();

// @route   GET /api/surveys
// @desc    Get all surveys
// @access  Private (Admin/Organizer) or Public (for mobile)
router.get('/', auth, async (req, res) => {
  try {
    const { eventId, type, status, isActive } = req.query;
    
    let whereClause = {};
    
    if (eventId) whereClause.eventId = eventId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const surveys = await Survey.findAll({
      where: whereClause,
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Program,
          as: 'session',
          attributes: ['id', 'title', 'description']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Map surveys to include responseCount for frontend compatibility
    const mappedSurveys = surveys.map(survey => {
      const surveyData = survey.toJSON();
      return {
        ...surveyData,
        responseCount: surveyData.currentResponses || 0
      };
    });

    res.json({
      success: true,
      surveys: mappedSurveys
    });
  } catch (error) {
    console.error('Get surveys error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/surveys/:id
// @desc    Get survey by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Program,
          as: 'session',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    // Map survey to include responseCount for frontend compatibility
    const surveyData = survey.toJSON();
    const mappedSurvey = {
      ...surveyData,
      responseCount: surveyData.currentResponses || 0
    };

    res.json({
      success: true,
      survey: mappedSurvey
    });
  } catch (error) {
    console.error('Get survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/surveys
// @desc    Create new survey
// @access  Private (Admin/Organizer)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const { 
      title, 
      description, 
      type, 
      status, 
      startDate, 
      endDate, 
      isAnonymous, 
      allowMultipleSubmissions, 
      showResults, 
      requireLogin, 
      maxResponses, 
      questions, 
      settings, 
      eventId, 
      sessionId, 
      notes
    } = req.body;

    if (!title || !questions || !eventId) {
      return res.status(400).json({
        success: false,
        error: 'Başlık, sorular ve etkinlik alanları zorunludur'
      });
    }

    const surveyData = {
      title,
      description: description || '',
      type: type || 'feedback',
      status: status || 'draft',
      startDate: startDate || null,
      endDate: endDate || null,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
      allowMultipleSubmissions: allowMultipleSubmissions || false,
      showResults: showResults !== undefined ? showResults : true,
      requireLogin: requireLogin || false,
      maxResponses: maxResponses || null,
      questions: JSON.stringify(questions),
      settings: settings ? JSON.stringify(settings) : null,
      eventId,
      createdBy: req.user.id,
      sessionId: sessionId || null,
      notes: notes || ''
    };

    const survey = await Survey.create(surveyData);
    
    const createdSurvey = await Survey.findByPk(survey.id, {
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Program,
          as: 'session',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    // Map survey to include responseCount for frontend compatibility
    const createdSurveyData = createdSurvey.toJSON();
    const mappedSurvey = {
      ...createdSurveyData,
      responseCount: createdSurveyData.currentResponses || 0
    };

    if (survey.status && survey.status !== 'draft') {
      notifyEvent(eventId, {
        title: 'Yeni anket',
        body: title,
        data: {
          type: 'survey',
          screen: '/surveys',
          surveyId: survey.id,
        },
        priority: 'high',
      }, { excludeUserId: req.user.id });
    }

    res.status(201).json({
      success: true,
      survey: mappedSurvey,
      message: 'Anket başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Anket oluşturulurken bir hata oluştu'
    });
  }
});

// @route   PUT /api/surveys/:id
// @desc    Update survey
// @access  Private (Admin/Organizer)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    const previousStatus = survey.status;

    const updateData = req.body;
    
    // Handle JSON fields
    if (updateData.questions) {
      updateData.questions = JSON.stringify(updateData.questions);
    }
    if (updateData.settings) {
      updateData.settings = JSON.stringify(updateData.settings);
    }
    
    await survey.update(updateData);
    
    await survey.reload({
      include: [
        {
          model: Event,
          as: 'event',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: Program,
          as: 'session',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    // Map survey to include responseCount for frontend compatibility
    const surveyData = survey.toJSON();
    const mappedSurvey = {
      ...surveyData,
      responseCount: surveyData.currentResponses || 0
    };

    if (survey.status === 'active' && previousStatus !== 'active') {
      notifyEvent(survey.eventId, {
        title: 'Yeni anket',
        body: survey.title,
        data: {
          type: 'survey',
          screen: '/surveys',
          surveyId: survey.id,
        },
        priority: 'high',
      }, { excludeUserId: req.user.id });
    }

    res.json({
      success: true,
      survey: mappedSurvey,
      message: 'Anket başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Anket güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/surveys/:id
// @desc    Delete survey
// @access  Private (Admin/Organizer)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    await survey.destroy();

    res.json({
      success: true,
      message: 'Anket başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete survey error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/surveys/:id/responses
// @desc    Submit survey response
// @access  Private (for logged in users) or Public
router.post('/:id/responses', auth, async (req, res) => {
  try {
    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Anket bulunamadı'
      });
    }

    // Check if survey is active
    if (!survey.isActive || survey.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Bu anket aktif değil'
      });
    }

    // Check date range
    const now = new Date();
    if (survey.startDate && new Date(survey.startDate) > now) {
      return res.status(400).json({
        success: false,
        error: 'Anket henüz başlamadı'
      });
    }
    if (survey.endDate && new Date(survey.endDate) < now) {
      return res.status(400).json({
        success: false,
        error: 'Anket süresi dolmuş'
      });
    }

    // Check max responses
    if (survey.maxResponses && survey.currentResponses >= survey.maxResponses) {
      return res.status(400).json({
        success: false,
        error: 'Anket yanıt kotası dolmuş'
      });
    }

    // Check if user already submitted (if multiple submissions not allowed)
    if (!survey.allowMultipleSubmissions && req.user) {
      const existingResponse = await SurveyResponse.findOne({
        where: {
          surveyId: survey.id,
          userId: req.user.id
        }
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          error: 'Bu anket için zaten yanıt verdiniz'
        });
      }
    }

    const { responses } = req.body;

    if (!responses) {
      return res.status(400).json({
        success: false,
        error: 'Yanıtlar zorunludur'
      });
    }

    const responseData = {
      surveyId: survey.id,
      eventId: survey.eventId,
      responses: JSON.stringify(responses),
      userId: survey.isAnonymous ? null : (req.user ? req.user.id : null),
      isAnonymous: survey.isAnonymous,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || null,
      submittedAt: new Date()
    };

    const surveyResponse = await SurveyResponse.create(responseData);

    // Update survey response count
    await survey.increment('currentResponses');
    
    // Reload survey to get updated count
    await survey.reload();
    
    console.log(`✅ Survey ${survey.id} response count updated to: ${survey.currentResponses}`);

    res.status(201).json({
      success: true,
      response: surveyResponse,
      message: 'Anket yanıtınız başarıyla gönderildi',
      survey: {
        ...survey.toJSON(),
        responseCount: survey.currentResponses || 0
      }
    });
  } catch (error) {
    console.error('Submit survey response error:', error);
    res.status(500).json({
      success: false,
      error: 'Anket yanıtı gönderilirken bir hata oluştu'
    });
  }
});

// @route   GET /api/surveys/:id/responses
// @desc    Get survey responses (Admin/Organizer only)
// @access  Private (Admin/Organizer)
router.get('/:id/responses', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin or organizer role required.'
      });
    }

    const survey = await Survey.findByPk(req.params.id);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: 'Survey not found'
      });
    }

    const responses = await SurveyResponse.findAll({
      where: { surveyId: survey.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      responses: responses
    });
  } catch (error) {
    console.error('Get survey responses error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;