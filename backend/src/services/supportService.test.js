const {
  canViewTicket,
  canReplyToTicket,
  canChangeTicketStatus,
  validateTicketCreate,
  normalizeAttachments
} = require('./supportService');

describe('supportService', () => {
  const ticket = { userId: 'user-1', eventId: 'event-1', status: 'open' };

  test('canViewTicket allows owner and staff only', () => {
    expect(canViewTicket({ id: 'user-1', role: 'participant' }, ticket)).toBe(true);
    expect(canViewTicket({ id: 'admin-1', role: 'admin' }, ticket)).toBe(true);
    expect(canViewTicket({ id: 'user-2', role: 'participant' }, ticket)).toBe(false);
  });

  test('canReplyToTicket only when ticket is open and viewer is allowed', () => {
    expect(canReplyToTicket({ id: 'user-1', role: 'participant' }, ticket)).toBe(true);
    expect(canReplyToTicket({ id: 'user-1', role: 'participant' }, { ...ticket, status: 'closed' })).toBe(false);
    expect(canReplyToTicket({ id: 'user-2', role: 'participant' }, ticket)).toBe(false);
  });

  test('canChangeTicketStatus allows owner and staff', () => {
    expect(canChangeTicketStatus({ id: 'user-1', role: 'participant' }, ticket)).toBe(true);
    expect(canChangeTicketStatus({ id: 'org-1', role: 'organizer' }, ticket)).toBe(true);
    expect(canChangeTicketStatus({ id: 'user-2', role: 'participant' }, ticket)).toBe(false);
  });

  test('validateTicketCreate requires subject, event and a message or attachment', () => {
    expect(validateTicketCreate({
      subject: 'Transfer sorunu',
      eventId: 'event-1',
      body: 'Araç gelmedi'
    }).ok).toBe(true);

    expect(validateTicketCreate({
      subject: 'Belge',
      eventId: 'event-1',
      attachments: [{ url: '/uploads/support/a.pdf' }]
    }).ok).toBe(true);

    expect(validateTicketCreate({
      subject: 'x',
      eventId: 'event-1',
      body: 'Merhaba'
    }).ok).toBe(false);

    expect(validateTicketCreate({
      subject: 'Transfer sorunu',
      eventId: 'event-1'
    }).ok).toBe(false);
  });

  test('normalizeAttachments keeps relative upload urls', () => {
    const files = normalizeAttachments([
      { url: 'http://localhost:3001/uploads/support/a.pdf', fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 10 },
      { url: '', fileName: 'skip' }
    ]);
    expect(files).toEqual([
      { url: '/uploads/support/a.pdf', fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 10, category: 'document' }
    ]);
  });
});
