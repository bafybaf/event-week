const express = require('express');
const { auth } = require('../middleware/auth');
const { Op, QueryTypes } = require('sequelize');
const Event = require('../models/Event');
const User = require('../models/User');
const Program = require('../models/Program');
const Speaker = require('../models/Speaker');
const Appointment = require('../models/Appointment');
const Voting = require('../models/Voting');
const { sequelize } = require('../models');

const router = express.Router();

// Admin auth middleware - allows admin and organizer
const adminAuth = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'organizer')) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Access denied. Admin or organizer role required.' });
  }
};

// @route   GET /api/admin/stats
// @desc    Get detailed statistics for admin dashboard
// @access  Private (Admin/Organizer)
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const { eventId } = req.query;
    console.log('GET /api/admin/stats called with eventId:', eventId);
    
    // Get basic counts - always fetch overall stats from database
    const [eventsResult] = await sequelize.query('SELECT COUNT(*) as count FROM events', { type: QueryTypes.SELECT });
    const eventsCount = parseInt(eventsResult?.count || '0') || 0;

    // Get users count - filter by eventId if provided
    let usersCount = 0;
    if (eventId) {
      const [usersResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM users WHERE event_id = :eventId',
        { 
          replacements: { eventId: String(eventId) },
          type: QueryTypes.SELECT 
        }
      );
      usersCount = parseInt(usersResult?.count || '0') || 0;
    } else {
      const [usersResult] = await sequelize.query('SELECT COUNT(*) as count FROM users', { type: QueryTypes.SELECT });
      usersCount = parseInt(usersResult?.count || '0') || 0;
    }

    // Get event-specific counts if eventId is provided, otherwise get all
    let programsCount = 0;
    let speakersCount = 0;
    let appointmentsCount = 0;
    let votingsCount = 0;

    if (eventId) {
      // Programs count for specific event
      const [programsResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM programs WHERE event_id = :eventId',
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      programsCount = parseInt(programsResult?.count || '0') || 0;

      // Speakers count for specific event
      const [speakersResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM speakers WHERE event_id = :eventId',
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      speakersCount = parseInt(speakersResult?.count || '0') || 0;

      // Appointments count for specific event
      const [appointmentsResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM appointments WHERE event_id = :eventId',
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      appointmentsCount = parseInt(appointmentsResult?.count || '0') || 0;

      // Votings count for specific event (through programs)
      const [votingsResult] = await sequelize.query(
        `SELECT COUNT(*) as count FROM votings v 
         INNER JOIN programs p ON v.program_id = p.id 
         WHERE p.event_id = :eventId`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      votingsCount = parseInt(votingsResult?.count || '0') || 0;
    } else {
      // Get all counts
      const [programsResult] = await sequelize.query('SELECT COUNT(*) as count FROM programs', { type: QueryTypes.SELECT });
      programsCount = parseInt(programsResult?.count || '0') || 0;

      const [speakersResult] = await sequelize.query('SELECT COUNT(*) as count FROM speakers', { type: QueryTypes.SELECT });
      speakersCount = parseInt(speakersResult?.count || '0') || 0;

      const [appointmentsResult] = await sequelize.query('SELECT COUNT(*) as count FROM appointments', { type: QueryTypes.SELECT });
      appointmentsCount = parseInt(appointmentsResult?.count || '0') || 0;

      const [votingsResult] = await sequelize.query('SELECT COUNT(*) as count FROM votings', { type: QueryTypes.SELECT });
      votingsCount = parseInt(votingsResult?.count || '0') || 0;
    }

    // Get event-specific statistics if eventId is provided
    let eventStats = null;
    if (eventId) {
      // Get event details
      const event = await Event.findByPk(eventId);
      if (!event) {
        return res.status(404).json({ success: false, error: 'Event not found' });
      }

      // Programs by type using raw SQL
      const programsByTypeResults = await sequelize.query(
        `SELECT type, COUNT(*) as count 
         FROM programs 
         WHERE event_id = :eventId 
         GROUP BY type`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const programsByType = programsByTypeResults.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {});

      // Programs by status using raw SQL
      const programsByStatusResults = await sequelize.query(
        `SELECT status, COUNT(*) as count 
         FROM programs 
         WHERE event_id = :eventId 
         GROUP BY status`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const programsByStatus = programsByStatusResults.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {});

      // Total attendance across all programs - try both column name formats
      let attendanceResult;
      try {
        // Try snake_case first (SQLite default)
        attendanceResult = await sequelize.query(
          `SELECT 
            COALESCE(SUM(current_attendance), 0) as totalAttendance,
            COALESCE(SUM(max_capacity), 0) as totalCapacity
           FROM programs 
           WHERE event_id = :eventId`,
          { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
        );
      } catch (err) {
        // If snake_case fails, try camelCase
        try {
          attendanceResult = await sequelize.query(
            `SELECT 
              COALESCE(SUM(currentAttendance), 0) as totalAttendance,
              COALESCE(SUM(maxCapacity), 0) as totalCapacity
             FROM programs 
             WHERE eventId = :eventId`,
            { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
          );
        } catch (err2) {
          // Fallback: use Sequelize sum
          const totalAtt = await Program.sum('currentAttendance', { where: { eventId: String(eventId) } }) || 0;
          const totalCap = await Program.sum('maxCapacity', { where: { eventId: String(eventId) } }) || 0;
          attendanceResult = [{ totalAttendance: totalAtt, totalCapacity: totalCap }];
        }
      }
      const totalAttendance = parseInt(attendanceResult[0]?.totalAttendance || '0') || 0;
      const totalCapacity = parseInt(attendanceResult[0]?.totalCapacity || '0') || 0;
      const attendanceRate = totalCapacity > 0 ? ((totalAttendance / totalCapacity) * 100).toFixed(2) : '0.00';

      // Appointments by status using raw SQL
      const appointmentsByStatusResults = await sequelize.query(
        `SELECT status, COUNT(*) as count 
         FROM appointments 
         WHERE event_id = :eventId 
         GROUP BY status`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const appointmentsByStatus = appointmentsByStatusResults.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {});

      // Appointments by type using raw SQL
      const appointmentsByTypeResults = await sequelize.query(
        `SELECT type, COUNT(*) as count 
         FROM appointments 
         WHERE event_id = :eventId 
         GROUP BY type`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const appointmentsByType = appointmentsByTypeResults.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {});

      // Speakers statistics using raw SQL
      const [keynoteResult] = await sequelize.query(
        `SELECT COUNT(*) as count 
         FROM speakers 
         WHERE event_id = :eventId AND is_keynote = 1`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const keynoteSpeakers = parseInt(keynoteResult?.count || '0') || 0;

      const [availableResult] = await sequelize.query(
        `SELECT COUNT(*) as count 
         FROM speakers 
         WHERE event_id = :eventId AND is_available = 1`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const availableSpeakers = parseInt(availableResult?.count || '0') || 0;

      // Voting statistics using raw SQL
      const [votingStatsResult] = await sequelize.query(
        `SELECT COUNT(*) as totalVotes 
         FROM votings v 
         INNER JOIN programs p ON v.program_id = p.id 
         WHERE p.event_id = :eventId`,
        { replacements: { eventId: String(eventId) }, type: QueryTypes.SELECT }
      );
      const totalVotes = parseInt(votingStatsResult?.totalVotes || '0') || 0;

      // Get users count for this specific event
      let eventUsersCount = 0;
      try {
        eventUsersCount = await User.count({
          where: { eventId: String(eventId) }
        });
      } catch (countError) {
        console.error('Error counting event users:', countError);
        // Try raw query as fallback
        try {
          const [countResult] = await sequelize.query(
            'SELECT COUNT(*) as count FROM users WHERE event_id = :eventId',
            {
              replacements: { eventId: String(eventId) },
              type: QueryTypes.SELECT
            }
          );
          eventUsersCount = parseInt(countResult?.count || '0') || 0;
        } catch (rawCountError) {
          console.error('Raw count query also failed:', rawCountError);
          eventUsersCount = 0; // Set to 0 if query fails
        }
      }

      // Recent programs (last 10) - using Sequelize for better date handling
      const recentPrograms = await Program.findAll({
        where: { eventId: String(eventId) },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'startTime', 'endTime', 'status', 'currentAttendance', 'maxCapacity']
      });

      // Recent appointments (last 10) - using Sequelize
      const recentAppointments = await Appointment.findAll({
        where: { eventId: String(eventId) },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id', 'title', 'appointmentDate', 'status', 'duration']
      });

      eventStats = {
        event: {
          id: event.id,
          name: event.name,
          description: event.description || '',
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location || '',
          isActive: event.isActive !== undefined ? event.isActive : true
        },
        programs: {
          total: programsCount,
          byType: programsByType,
          byStatus: programsByStatus,
          attendance: {
            total: totalAttendance,
            capacity: totalCapacity,
            rate: parseFloat(attendanceRate)
          },
          recent: recentPrograms.map(p => ({
            id: p.id,
            title: p.title || '',
            startTime: p.startTime,
            endTime: p.endTime,
            status: p.status || 'scheduled',
            attendance: `${p.currentAttendance || 0}/${p.maxCapacity || 'N/A'}`
          }))
        },
        speakers: {
          total: speakersCount,
          keynote: keynoteSpeakers,
          available: availableSpeakers
        },
        appointments: {
          total: appointmentsCount,
          byStatus: appointmentsByStatus,
          byType: appointmentsByType,
          recent: recentAppointments.map(a => ({
            id: a.id,
            title: a.title || '',
            appointmentDate: a.appointmentDate,
            status: a.status || 'pending',
            duration: a.duration || 30
          }))
        },
        voting: {
          total: totalVotes
        },
        users: {
          total: eventUsersCount
        }
      };
    }

    // Get actual events list
    let eventsList = [];
    try {
      eventsList = await Event.findAll({
        attributes: ['id', 'name', 'description', 'startDate', 'endDate', 'location', 'isActive'],
        order: [['createdAt', 'DESC']],
        limit: 10
      });
    } catch (eventsError) {
      console.error('Error fetching events list:', eventsError);
      console.error('Events error details:', eventsError.message, eventsError.stack);
      eventsList = [];
    }

    // Get actual users list (participants) - filter by eventId if provided
    let usersList = [];
    try {
      const usersWhere = eventId ? { eventId: String(eventId) } : {};
      usersList = await User.findAll({
        where: usersWhere,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'role', 'company', 'isActive', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 20
      });
    } catch (usersError) {
      console.error('Error fetching users list:', usersError);
      console.error('Users error details:', usersError.message, usersError.stack);
      // Try raw query as fallback
      try {
        const usersQuery = eventId 
          ? 'SELECT id, first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", role, company, is_active as "isActive", created_at as "createdAt" FROM users WHERE event_id = :eventId ORDER BY created_at DESC LIMIT 20'
          : 'SELECT id, first_name as "firstName", last_name as "lastName", email, phone_number as "phoneNumber", role, company, is_active as "isActive", created_at as "createdAt" FROM users ORDER BY created_at DESC LIMIT 20';
        const rawUsers = await sequelize.query(usersQuery, { 
          replacements: eventId ? { eventId: String(eventId) } : {},
          type: QueryTypes.SELECT 
        });
        usersList = rawUsers;
      } catch (rawError) {
        console.error('Raw query also failed:', rawError);
        usersList = [];
      }
    }

    // Get users by role breakdown - filter by eventId if provided
    let roleBreakdown = {};
    try {
      const roleQuery = eventId
        ? 'SELECT role, COUNT(*) as count FROM users WHERE event_id = :eventId GROUP BY role'
        : 'SELECT role, COUNT(*) as count FROM users GROUP BY role';
      const roleResults = await sequelize.query(roleQuery, {
        replacements: eventId ? { eventId: String(eventId) } : {},
        type: QueryTypes.SELECT,
        raw: true
      });
      
      roleBreakdown = roleResults.reduce((acc, item) => {
        acc[item.role] = parseInt(item.count || '0');
        return acc;
      }, {});
    } catch (roleError) {
      console.error('Error getting users by role:', roleError);
      roleBreakdown = {};
    }

    // Overall statistics - always return from database
    const overallStats = {
      events: eventsCount,
      users: usersCount,
      programs: programsCount,
      speakers: speakersCount,
      appointments: appointmentsCount,
      votings: votingsCount,
      usersByRole: roleBreakdown
    };

    console.log('Returning stats:', {
      overall: overallStats,
      event: eventStats ? 'has event stats' : 'no event stats',
      eventsCount: eventsList.length,
      usersCount: usersList.length
    });

    res.json({
      success: true,
      data: {
        overall: overallStats,
        event: eventStats,
        eventsList: eventsList.map(e => {
          // Handle both Sequelize model and raw query results
          const event = e.toJSON ? e.toJSON() : e;
          return {
            id: event.id,
            name: event.name || '',
            description: event.description || '',
            startDate: event.startDate || event.start_date || null,
            endDate: event.endDate || event.end_date || null,
            location: event.location || '',
            isActive: event.isActive !== undefined ? event.isActive : (event.is_active !== undefined ? event.is_active : true)
          };
        }),
        usersList: usersList.map(u => {
          // Handle both Sequelize model and raw query results
          const user = u.toJSON ? u.toJSON() : u;
          return {
            id: user.id,
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || user.phone_number || '',
            role: user.role || '',
            company: user.company || '',
            isActive: user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true),
            createdAt: user.createdAt || user.created_at || new Date().toISOString()
          };
        })
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.parent) {
      console.error('SQL Error:', error.parent.message);
      console.error('SQL:', error.parent.sql);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name,
        sql: error.parent?.sql,
        sqlMessage: error.parent?.message
      } : undefined
    });
  }
});

module.exports = router;
