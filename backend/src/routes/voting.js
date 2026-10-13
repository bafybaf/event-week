const express = require('express');
const { auth } = require('../middleware/auth');
const Voting = require('../models/Voting');
const Program = require('../models/Program');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/voting
// @desc    Get all votes for a program
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { programId, userId } = req.query;
    
    let whereClause = {};
    
    if (programId) whereClause.programId = programId;
    if (userId) whereClause.userId = userId;
    
    const votes = await Voting.findAll({
      where: whereClause,
      include: [
        {
          model: Program,
          as: 'program',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'userId'
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      votes: votes
    });
  } catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   GET /api/voting/:id
// @desc    Get vote by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const vote = await Voting.findByPk(req.params.id, {
      include: [
        {
          model: Program,
          as: 'program',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'userId'
        }
      ]
    });

    if (!vote) {
      return res.status(404).json({
        success: false,
        error: 'Vote not found'
      });
    }

    res.json({
      success: true,
      vote: vote
    });
  } catch (error) {
    console.error('Get vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @route   POST /api/voting
// @desc    Submit a vote
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      programId,
      question,
      selectedOption,
      selectedOptions,
      textResponse,
      rating
    } = req.body;

    if (!programId || !question) {
      return res.status(400).json({
        success: false,
        error: 'Program ID ve soru zorunludur'
      });
    }

    // Check if user already voted for this program
    const existingVote = await Voting.findOne({
      where: {
        programId,
        userId: req.user.id
      }
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        error: 'Bu program için zaten oy kullandınız'
      });
    }

    const voteData = {
      programId,
      userId: req.user.id,
      question,
      selectedOption: selectedOption || null,
      selectedOptions: selectedOptions || [],
      textResponse: textResponse || null,
      rating: rating || null,
      submittedAt: new Date()
    };

    const vote = await Voting.create(voteData);
    
    const createdVote = await Voting.findByPk(vote.id, {
      include: [
        {
          model: Program,
          as: 'program',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'userId'
        }
      ]
    });

    res.status(201).json({
      success: true,
      vote: createdVote,
      message: 'Oy başarıyla gönderildi'
    });
  } catch (error) {
    console.error('Create vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Oy gönderilirken bir hata oluştu'
    });
  }
});

// @route   PUT /api/voting/:id
// @desc    Update vote (only before deadline)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const vote = await Voting.findByPk(req.params.id);
    if (!vote) {
      return res.status(404).json({
        success: false,
        error: 'Vote not found'
      });
    }

    // Check access
    if (vote.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await vote.update(req.body);
    
    await vote.reload({
      include: [
        {
          model: Program,
          as: 'program',
          attributes: ['id', 'title', 'description']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          foreignKey: 'userId'
        }
      ]
    });

    res.json({
      success: true,
      vote: vote,
      message: 'Oy başarıyla güncellendi'
    });
  } catch (error) {
    console.error('Update vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Oy güncellenirken bir hata oluştu'
    });
  }
});

// @route   DELETE /api/voting/:id
// @desc    Delete vote
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const vote = await Voting.findByPk(req.params.id);
    if (!vote) {
      return res.status(404).json({
        success: false,
        error: 'Vote not found'
      });
    }

    await vote.destroy();

    res.json({
      success: true,
      message: 'Oy başarıyla silindi'
    });
  } catch (error) {
    console.error('Delete vote error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;
