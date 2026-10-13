const {
  isStaff,
  canManageItem,
  canDeleteComment,
  resolveEventScope,
  validateCreatePayload,
  splitFeedItems
} = require('./feedService');

describe('feedService', () => {
  test('isStaff treats admin and organizer as staff', () => {
    expect(isStaff({ role: 'admin' })).toBe(true);
    expect(isStaff({ role: 'organizer' })).toBe(true);
    expect(isStaff({ role: 'participant' })).toBe(false);
    expect(isStaff({ role: 'speaker' })).toBe(false);
  });

  test('canManageItem allows author or staff, not other participants', () => {
    const item = { authorId: 'user-1' };
    expect(canManageItem({ id: 'user-1', role: 'participant' }, item)).toBe(true);
    expect(canManageItem({ id: 'admin-1', role: 'admin' }, item)).toBe(true);
    expect(canManageItem({ id: 'user-2', role: 'participant' }, item)).toBe(false);
  });

  test('canDeleteComment allows comment author or staff', () => {
    const comment = { userId: 'user-1' };
    expect(canDeleteComment({ id: 'user-1', role: 'participant' }, comment)).toBe(true);
    expect(canDeleteComment({ id: 'org-1', role: 'organizer' }, comment)).toBe(true);
    expect(canDeleteComment({ id: 'user-2', role: 'participant' }, comment)).toBe(false);
  });

  test('resolveEventScope locks participants to their own event', () => {
    expect(resolveEventScope({ role: 'participant', eventId: 'event-9' }, 'event-1')).toEqual({
      eventId: 'event-9'
    });
    expect(resolveEventScope({ role: 'participant' }, 'event-1')).toEqual({
      error: 'Etkinlik bilgisi bulunamadı'
    });
  });

  test('resolveEventScope lets staff filter or list all events', () => {
    expect(resolveEventScope({ role: 'admin' }, 'event-3')).toEqual({ eventId: 'event-3' });
    expect(resolveEventScope({ role: 'organizer' }, '')).toEqual({ eventId: null });
  });

  test('validateCreatePayload requires kind, media and event', () => {
    expect(validateCreatePayload({
      kind: 'post',
      mediaUrl: '/uploads/feed/a.jpg',
      mediaType: 'image',
      eventId: 'event-1'
    }).ok).toBe(true);

    expect(validateCreatePayload({
      kind: 'story',
      mediaUrl: '/uploads/feed/a.mp4',
      mediaType: 'video',
      eventId: 'event-1'
    }).ok).toBe(true);

    expect(validateCreatePayload({
      kind: 'reel',
      mediaUrl: '/uploads/feed/a.jpg',
      mediaType: 'image',
      eventId: 'event-1'
    }).ok).toBe(false);

    expect(validateCreatePayload({
      kind: 'post',
      mediaUrl: '',
      mediaType: 'image',
      eventId: 'event-1'
    }).ok).toBe(false);
  });

  test('splitFeedItems separates active stories and posts', () => {
    const result = splitFeedItems([
      { id: '1', kind: 'story', isActive: true },
      { id: '2', kind: 'post', isActive: true },
      { id: '3', kind: 'story', isActive: false },
      { id: '4', kind: 'post', isActive: true }
    ]);

    expect(result.stories.map((item) => item.id)).toEqual(['1']);
    expect(result.posts.map((item) => item.id)).toEqual(['2', '4']);
  });
});
