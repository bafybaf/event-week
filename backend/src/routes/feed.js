const express = require('express');
const { auth } = require('../middleware/auth');
const { FeedItem, FeedLike, FeedComment, User, Event } = require('../models');
const {
  canManageItem,
  canDeleteComment,
  resolveEventScope,
  validateCreatePayload,
  splitFeedItems,
  toRelativeUploadUrl
} = require('../services/feedService');

const router = express.Router();

const authorAttributes = ['id', 'firstName', 'lastName', 'profileImage', 'role'];

const loadUsersMap = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return {};
  const users = await User.findAll({
    where: { id: uniqueIds },
    attributes: authorAttributes
  });
  return users.reduce((acc, user) => {
    acc[String(user.id)] = user.toJSON ? user.toJSON() : user;
    return acc;
  }, {});
};

const loadEventsMap = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) return {};
  const events = await Event.findAll({
    where: { id: uniqueIds },
    attributes: ['id', 'name']
  });
  return events.reduce((acc, event) => {
    acc[String(event.id)] = event.toJSON ? event.toJSON() : event;
    return acc;
  }, {});
};

const serializeItem = (item, extras = {}) => {
  const data = item.toJSON ? item.toJSON() : { ...item };
  return {
    ...data,
    mediaUrl: toRelativeUploadUrl(data.mediaUrl),
    thumbnailUrl: toRelativeUploadUrl(data.thumbnailUrl),
    likeCount: extras.likeCount || 0,
    commentCount: extras.commentCount || 0,
    likedByMe: !!extras.likedByMe,
    author: extras.author || null,
    event: extras.event || null
  };
};

const hydrateItems = async (items, currentUserId) => {
  const itemIds = items.map((item) => item.id);
  const [likes, comments, authorsMap, eventsMap] = await Promise.all([
    itemIds.length ? FeedLike.findAll({ where: { feedItemId: itemIds } }) : [],
    itemIds.length ? FeedComment.findAll({ where: { feedItemId: itemIds } }) : [],
    loadUsersMap(items.map((item) => item.authorId)),
    loadEventsMap(items.map((item) => item.eventId))
  ]);

  const likeCountByItem = {};
  const likedByMe = {};
  likes.forEach((like) => {
    const key = String(like.feedItemId);
    likeCountByItem[key] = (likeCountByItem[key] || 0) + 1;
    if (String(like.userId) === String(currentUserId)) {
      likedByMe[key] = true;
    }
  });

  const commentCountByItem = {};
  comments.forEach((comment) => {
    const key = String(comment.feedItemId);
    commentCountByItem[key] = (commentCountByItem[key] || 0) + 1;
  });

  return items.map((item) => serializeItem(item, {
    likeCount: likeCountByItem[String(item.id)] || 0,
    commentCount: commentCountByItem[String(item.id)] || 0,
    likedByMe: !!likedByMe[String(item.id)],
    author: authorsMap[String(item.authorId)] || null,
    event: eventsMap[String(item.eventId)] || null
  }));
};

router.get('/', auth, async (req, res) => {
  try {
    const scope = resolveEventScope(req.user, req.query.eventId);
    if (scope.error) {
      return res.status(400).json({ success: false, error: scope.error });
    }

    const where = { isActive: true };
    if (scope.eventId) {
      where.eventId = scope.eventId;
    }

    const items = await FeedItem.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    const hydrated = await hydrateItems(items, req.user.id);
    const { stories, posts } = splitFeedItems(hydrated);

    res.json({ success: true, stories, posts, items: hydrated });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ success: false, error: 'Feed yüklenemedi' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const item = await FeedItem.findByPk(req.params.id);
    if (!item || item.isActive === false) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }

    const [hydrated] = await hydrateItems([item], req.user.id);
    res.json({ success: true, item: hydrated });
  } catch (error) {
    console.error('Get feed item error:', error);
    res.status(500).json({ success: false, error: 'Paylaşım yüklenemedi' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const scope = resolveEventScope(req.user, req.body.eventId);
    if (scope.error) {
      return res.status(400).json({ success: false, error: scope.error });
    }
    if (!scope.eventId) {
      return res.status(400).json({ success: false, error: 'Etkinlik gerekli' });
    }

    const payload = {
      kind: req.body.kind,
      mediaUrl: toRelativeUploadUrl(req.body.mediaUrl),
      mediaType: req.body.mediaType,
      eventId: scope.eventId
    };

    const validation = validateCreatePayload(payload);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const item = await FeedItem.create({
      ...payload,
      authorId: req.user.id,
      caption: req.body.caption || '',
      thumbnailUrl: toRelativeUploadUrl(req.body.thumbnailUrl),
      fileName: req.body.fileName || '',
      fileSize: req.body.fileSize || null,
      isActive: true
    });

    const [hydrated] = await hydrateItems([item], req.user.id);
    res.status(201).json({ success: true, item: hydrated });
  } catch (error) {
    console.error('Create feed item error:', error);
    res.status(500).json({ success: false, error: 'Paylaşım kaydedilemedi' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const item = await FeedItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }
    if (!canManageItem(req.user, item)) {
      return res.status(403).json({ success: false, error: 'Bu paylaşımı düzenleyemezsiniz' });
    }

    const updates = {};
    if (req.body.caption !== undefined) updates.caption = req.body.caption;
    if (req.body.isActive !== undefined) updates.isActive = !!req.body.isActive;
    if (req.body.mediaUrl) updates.mediaUrl = toRelativeUploadUrl(req.body.mediaUrl);
    if (req.body.mediaType) updates.mediaType = req.body.mediaType;
    if (req.body.thumbnailUrl !== undefined) {
      updates.thumbnailUrl = toRelativeUploadUrl(req.body.thumbnailUrl);
    }

    await item.update(updates);
    const [hydrated] = await hydrateItems([item], req.user.id);
    res.json({ success: true, item: hydrated });
  } catch (error) {
    console.error('Update feed item error:', error);
    res.status(500).json({ success: false, error: 'Paylaşım güncellenemedi' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await FeedItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }
    if (!canManageItem(req.user, item)) {
      return res.status(403).json({ success: false, error: 'Bu paylaşımı silemezsiniz' });
    }

    await FeedLike.destroy({ where: { feedItemId: item.id } });
    await FeedComment.destroy({ where: { feedItemId: item.id } });
    await item.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error('Delete feed item error:', error);
    res.status(500).json({ success: false, error: 'Paylaşım silinemedi' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const item = await FeedItem.findByPk(req.params.id);
    if (!item || item.isActive === false) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }

    const existing = await FeedLike.findOne({
      where: { feedItemId: item.id, userId: req.user.id }
    });

    if (existing) {
      await existing.destroy();
    } else {
      await FeedLike.create({ feedItemId: item.id, userId: req.user.id });
    }

    const likeCount = await FeedLike.count({ where: { feedItemId: item.id } });
    res.json({
      success: true,
      liked: !existing,
      likeCount
    });
  } catch (error) {
    console.error('Toggle feed like error:', error);
    res.status(500).json({ success: false, error: 'Beğeni kaydedilemedi' });
  }
});

router.get('/:id/comments', auth, async (req, res) => {
  try {
    const item = await FeedItem.findByPk(req.params.id);
    if (!item || item.isActive === false) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }

    const comments = await FeedComment.findAll({
      where: { feedItemId: item.id },
      order: [['createdAt', 'ASC']]
    });
    const usersMap = await loadUsersMap(comments.map((comment) => comment.userId));

    res.json({
      success: true,
      comments: comments.map((comment) => {
        const data = comment.toJSON();
        return {
          ...data,
          user: usersMap[String(comment.userId)] || null
        };
      })
    });
  } catch (error) {
    console.error('Get feed comments error:', error);
    res.status(500).json({ success: false, error: 'Yorumlar yüklenemedi' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, error: 'Yorum boş olamaz' });
    }

    const item = await FeedItem.findByPk(req.params.id);
    if (!item || item.isActive === false) {
      return res.status(404).json({ success: false, error: 'Paylaşım bulunamadı' });
    }

    const comment = await FeedComment.create({
      feedItemId: item.id,
      userId: req.user.id,
      text
    });

    const usersMap = await loadUsersMap([req.user.id]);
    res.status(201).json({
      success: true,
      comment: {
        ...comment.toJSON(),
        user: usersMap[String(req.user.id)] || null
      }
    });
  } catch (error) {
    console.error('Create feed comment error:', error);
    res.status(500).json({ success: false, error: 'Yorum kaydedilemedi' });
  }
});

router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await FeedComment.findByPk(req.params.commentId);
    if (!comment || String(comment.feedItemId) !== String(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Yorum bulunamadı' });
    }
    if (!canDeleteComment(req.user, comment)) {
      return res.status(403).json({ success: false, error: 'Bu yorumu silemezsiniz' });
    }

    await comment.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete feed comment error:', error);
    res.status(500).json({ success: false, error: 'Yorum silinemedi' });
  }
});

module.exports = router;
