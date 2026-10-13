const { Expo } = require('expo-server-sdk');
const { Op } = require('sequelize');
const User = require('../models/User');

const DEFAULT_CHANNEL = 'event-week';

class NotificationService {
  constructor() {
    this.expo = new Expo();
  }

  buildMessage(pushToken, notification) {
    return {
      to: pushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      priority: notification.priority === 'high' ? 'high' : 'default',
      badge: notification.badge,
      channelId: notification.channelId || DEFAULT_CHANNEL,
    };
  }

  userAllowsPush(user, notification) {
    const prefs = (user && user.preferences) || {};
    if (prefs.notificationsEnabled === false) {
      return false;
    }
    const type = notification && notification.data && notification.data.type;
    const categoryKey = {
      announcement: 'notifyAnnouncements',
      program: 'notifyProgram',
      appointment: 'notifyAppointments',
      support: 'notifySupport',
      voting: 'notifyVoting',
      document: 'notifyDocuments',
      survey: 'notifySurveys',
      transfer: 'notifyTransfers',
      activity: 'notifyActivities',
      flight: 'notifyFlights',
    }[type];
    if (categoryKey && prefs[categoryKey] === false) {
      return false;
    }
    return true;
  }

  collectTokens(users, notification) {
    return [...new Set(
      (users || [])
        .filter((user) => user && this.userAllowsPush(user, notification))
        .map((user) => user.pushToken)
        .filter((token) => token && String(token).trim() !== '' && Expo.isExpoPushToken(token))
    )];
  }

  // Send push notification to a single device
  async sendPushNotification(pushToken, notification) {
    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return false;
      }

      const chunks = this.expo.chunkPushNotifications([this.buildMessage(pushToken, notification)]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  // Send push notification to multiple devices
  async sendBulkPushNotifications(pushTokens, notification) {
    try {
      const validTokens = this.collectTokens((pushTokens || []).map((token) => ({ pushToken: token })));

      if (validTokens.length === 0) {
        console.log('No valid push tokens found');
        return [];
      }

      const messages = validTokens.map((token) => this.buildMessage(token, notification));
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      return tickets;
    } catch (error) {
      console.error('Error sending bulk push notifications:', error);
      return [];
    }
  }

  // Send notification to all users of an event
  async sendEventNotification(eventId, notification, options = {}) {
    try {
      if (!eventId) {
        console.log('No eventId provided for event notification');
        return [];
      }

      const where = {
        isActive: true,
        eventId: String(eventId),
      };

      if (options.excludeUserId) {
        where.id = { [Op.ne]: String(options.excludeUserId) };
      }

      if (options.roles && options.roles.length) {
        where.role = { [Op.in]: options.roles };
      }

      const users = await User.findAll({
        where,
        attributes: ['id', 'pushToken', 'preferences'],
      });

      const pushTokens = this.collectTokens(users, notification);

      if (pushTokens.length === 0) {
        console.log(`No push tokens found for event ${eventId}`);
        return [];
      }

      return await this.sendBulkPushNotifications(pushTokens, {
        ...notification,
        data: {
          ...(notification.data || {}),
          eventId: String(eventId),
        },
      });
    } catch (error) {
      console.error('Error sending event notification:', error);
      return [];
    }
  }

  async sendUsersNotification(userIds, notification) {
    try {
      const ids = [...new Set((userIds || []).filter(Boolean).map(String))];
      if (ids.length === 0) {
        return [];
      }

      const users = await User.findAll({
        where: {
          id: ids,
          isActive: true,
        },
        attributes: ['pushToken', 'preferences'],
      });

      return await this.sendBulkPushNotifications(this.collectTokens(users, notification), notification);
    } catch (error) {
      console.error('Error sending users notification:', error);
      return [];
    }
  }

  async sendStaffNotification(eventId, notification, options = {}) {
    try {
      const where = {
        isActive: true,
        [Op.or]: [
          { role: 'admin' },
          {
            role: 'organizer',
            ...(eventId ? { eventId: String(eventId) } : {}),
          },
        ],
      };

      if (options.excludeUserId) {
        where.id = { [Op.ne]: String(options.excludeUserId) };
      }

      const users = await User.findAll({
        where,
        attributes: ['pushToken', 'preferences'],
      });

      return await this.sendBulkPushNotifications(this.collectTokens(users, notification), {
        ...notification,
        data: {
          ...(notification.data || {}),
          eventId: eventId ? String(eventId) : undefined,
        },
      });
    } catch (error) {
      console.error('Error sending staff notification:', error);
      return [];
    }
  }

  // Send notification to specific user
  async sendUserNotification(userId, notification) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user || !user.pushToken) {
        console.log(`No push token found for user ${userId}`);
        return false;
      }

      if (!this.userAllowsPush(user, notification)) {
        return false;
      }

      return await this.sendPushNotification(user.pushToken, {
        ...notification,
        data: {
          ...(notification.data || {}),
          userId: String(userId),
        },
      });
    } catch (error) {
      console.error('Error sending user notification:', error);
      return false;
    }
  }

  // Send notification to users with specific role
  async sendRoleNotification(role, notification) {
    try {
      const users = await User.findAll({
        where: { 
          role,
          isActive: true,
        },
        attributes: ['pushToken', 'preferences'],
      });

      const pushTokens = this.collectTokens(users, notification);

      if (pushTokens.length === 0) {
        console.log(`No push tokens found for role ${role}`);
        return [];
      }

      return await this.sendBulkPushNotifications(pushTokens, {
        ...notification,
        data: {
          ...(notification.data || {}),
          role,
        },
      });
    } catch (error) {
      console.error('Error sending role notification:', error);
      return [];
    }
  }

  // Event-specific notification methods
  async sendEventReminder(eventId, eventTitle, eventTime) {
    const notification = {
      title: 'Etkinlik Hatırlatması',
      body: `${eventTitle} etkinliği yakında başlayacak!`,
      data: {
        eventTitle,
        eventTime: eventTime.toISOString(),
        type: 'event',
        screen: '/(tabs)',
      },
      priority: 'high',
    };

    return await this.sendEventNotification(eventId, notification);
  }

  async sendVotingNotification(eventId, votingTitle, votingQuestion) {
    const notification = {
      title: 'Yeni Oylama',
      body: `${votingTitle}: ${votingQuestion}`,
      data: {
        votingTitle,
        votingQuestion,
        type: 'voting',
        screen: '/voting',
      },
      priority: 'high',
    };

    return await this.sendEventNotification(eventId, notification);
  }

  async sendAnnouncementNotification(eventId, announcementTitle, announcementContent) {
    const notification = {
      title: 'Yeni Duyuru',
      body: `${announcementTitle}: ${announcementContent}`,
      data: {
        announcementTitle,
        announcementContent,
        type: 'announcement',
        screen: '/announcements',
      },
      priority: 'default',
    };

    return await this.sendEventNotification(eventId, notification);
  }

  async sendAppointmentStatusNotification(userId, appointmentTitle, status) {
    const statusText = status === 'accepted' ? 'kabul edildi' : 'reddedildi';
    
    const notification = {
      title: 'Randevu Durumu',
      body: `${appointmentTitle} randevunuz ${statusText}.`,
      data: {
        appointmentTitle,
        status,
        type: 'appointment',
        screen: '/appointments',
      },
      priority: 'default',
    };

    return await this.sendUserNotification(userId, notification);
  }

  async sendAppointmentReminder(userId, appointmentTitle, appointmentTime) {
    const notification = {
      title: 'Randevu Hatırlatması',
      body: `${appointmentTitle} randevunuz yakında başlayacak!`,
      data: {
        appointmentTitle,
        appointmentTime: appointmentTime.toISOString(),
        type: 'appointment',
        screen: '/appointments',
      },
      priority: 'high',
    };

    return await this.sendUserNotification(userId, notification);
  }

  async sendTransferReminder(userId, transferType, transferTime) {
    const notification = {
      title: 'Transfer Hatırlatması',
      body: `${transferType} transferiniz yakında başlayacak!`,
      data: {
        transferType,
        transferTime: transferTime.toISOString(),
        type: 'transfer',
        screen: '/transfers',
      },
      priority: 'default',
    };

    return await this.sendUserNotification(userId, notification);
  }

  async sendFlightUpdateNotification(userId, flightNumber, updateType, details) {
    let title = 'Uçuş Güncellemesi';
    let body = '';
    
    switch (updateType) {
      case 'delay':
        title = 'Uçuş Gecikmesi';
        body = `${flightNumber} uçuşunuz gecikmiştir: ${details}`;
        break;
      case 'gate_change':
        title = 'Kapı Değişikliği';
        body = `${flightNumber} uçuşunuzun kapısı değişmiştir: ${details}`;
        break;
      case 'cancellation':
        title = 'Uçuş İptali';
        body = `${flightNumber} uçuşunuz iptal edilmiştir: ${details}`;
        break;
      default:
        body = `${flightNumber} uçuşunuzda güncelleme: ${details}`;
    }
    
    const notification = {
      title,
      body,
      data: {
        flightNumber,
        updateType,
        details,
        type: 'flight',
        screen: '/flights',
      },
      priority: 'high',
    };

    return await this.sendUserNotification(userId, notification);
  }

  async sendActivityReminder(userId, activityTitle, activityTime) {
    const notification = {
      title: 'Aktivite Hatırlatması',
      body: `${activityTitle} aktivitesi yakında başlayacak!`,
      data: {
        activityTitle,
        activityTime: activityTime.toISOString(),
        type: 'activity',
        screen: '/activities',
      },
      priority: 'default',
    };

    return await this.sendUserNotification(userId, notification);
  }

  async sendProgramReminder(userId, programTitle, programTime) {
    const notification = {
      title: 'Program Hatırlatması',
      body: `${programTitle} oturumu yakında başlayacak!`,
      data: {
        programTitle,
        programTime: programTime.toISOString(),
        type: 'program',
        screen: '/(tabs)/program',
      },
      priority: 'high',
    };

    return await this.sendUserNotification(userId, notification);
  }

  // Check notification receipts
  async checkNotificationReceipts(tickets) {
    try {
      const receiptIds = tickets
        .filter(ticket => ticket.id)
        .map(ticket => ticket.id);

      if (receiptIds.length === 0) {
        return [];
      }

      const receipts = await this.expo.getPushNotificationReceiptsAsync(receiptIds);
      return receipts;
    } catch (error) {
      console.error('Error checking notification receipts:', error);
      return [];
    }
  }

  // Update user push token
  async updateUserPushToken(userId, pushToken) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.pushToken = pushToken;
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user push token:', error);
      return false;
    }
  }

  // Remove user push token
  async removeUserPushToken(userId) {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.pushToken = null;
        await user.save();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing user push token:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();
