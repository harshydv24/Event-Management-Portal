/**
 * Unit tests for the Zod validation schemas.
 *
 * Tests every schema for: valid inputs, missing required fields,
 * length violations, format violations, and type violations.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import {
  validate,
  ValidationError,
  firestoreIdSchema,
  loginSchema,
  signupSchema,
  updateProfileSchema,
  createEventSchema,
  updateEventSchema,
  eventStatusUpdateSchema,
  selectVenueSchema,
  eventParticipantSchema,
  teamRegistrationSchema,
  clubMemberSchema,
  createClubSchema,
  updateClubSchema,
  postAnnouncementSchema,
  createNotificationSchema,
  notificationForUserSchema,
  notificationsForRoleSchema,
} from '@/lib/validationSchemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Expect a ValidationError to be thrown with a field-level error. */
function expectValidationError(fn: () => void, fieldSubstring?: string) {
  try {
    fn();
    expect.unreachable('should have thrown ValidationError');
  } catch (err) {
    expect(err).toBeInstanceOf(ValidationError);
    if (fieldSubstring) {
      expect((err as ValidationError).message).toContain(fieldSubstring);
    }
  }
}

// ---------------------------------------------------------------------------
// 1. firestoreIdSchema
// ---------------------------------------------------------------------------

describe('firestoreIdSchema', () => {
  it('accepts a valid ID', () => {
    expect(() => validate(firestoreIdSchema, 'abc123')).not.toThrow();
    expect(() => validate(firestoreIdSchema, 'A'.repeat(128))).not.toThrow();
  });

  it('rejects empty string', () => {
    expectValidationError(() => validate(firestoreIdSchema, ''));
  });

  it('rejects string with whitespace', () => {
    expectValidationError(() => validate(firestoreIdSchema, 'abc 123'));
  });

  it('rejects string exceeding 128 chars', () => {
    expectValidationError(() => validate(firestoreIdSchema, 'A'.repeat(129)));
  });

  it('rejects non-string input', () => {
    expectValidationError(() => validate(firestoreIdSchema, 12345));
  });
});

// ---------------------------------------------------------------------------
// 2. loginSchema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  const validLogin = {
    email: 'user@example.com',
    password: 'secret123',
    role: 'student' as const,
  };

  it('accepts valid login data', () => {
    expect(() => validate(loginSchema, validLogin)).not.toThrow();
  });

  it('rejects missing email', () => {
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, email: undefined }),
    );
  });

  it('rejects invalid email format', () => {
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, email: 'not-an-email' }),
      'email',
    );
  });

  it('rejects email exceeding 254 chars', () => {
    const longEmail = 'a'.repeat(250) + '@test.com'; // 259 chars
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, email: longEmail }),
    );
  });

  it('rejects password shorter than 6 chars', () => {
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, password: '12345' }),
      'password',
    );
  });

  it('rejects password longer than 128 chars', () => {
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, password: 'A'.repeat(129) }),
    );
  });

  it('rejects invalid role', () => {
    expectValidationError(
      () => validate(loginSchema, { ...validLogin, role: 'admin' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. signupSchema
// ---------------------------------------------------------------------------

describe('signupSchema', () => {
  const validSignup = {
    email: 'newuser@example.com',
    password: 'secret123',
    name: 'Jane Doe',
    role: 'student' as const,
  };

  it('accepts valid signup data', () => {
    expect(() => validate(signupSchema, validSignup)).not.toThrow();
  });

  it('accepts signup with optional universityId', () => {
    expect(() =>
      validate(signupSchema, { ...validSignup, universityId: 'UID123' }),
    ).not.toThrow();
  });

  it('rejects missing name', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, name: undefined }),
    );
  });

  it('rejects empty name', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, name: '' }),
    );
  });

  it('rejects name exceeding 100 chars', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, name: 'A'.repeat(101) }),
    );
  });

  it('rejects name with leading whitespace', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, name: ' John' }),
    );
  });

  it('rejects non-alphanumeric universityId', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, universityId: 'UID-123!' }),
    );
  });

  it('rejects universityId exceeding 50 chars', () => {
    expectValidationError(
      () => validate(signupSchema, { ...validSignup, universityId: 'A'.repeat(51) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. updateProfileSchema
// ---------------------------------------------------------------------------

describe('updateProfileSchema', () => {
  it('accepts name-only update', () => {
    expect(() => validate(updateProfileSchema, { name: 'Updated' })).not.toThrow();
  });

  it('accepts uid-only update', () => {
    expect(() => validate(updateProfileSchema, { uid: 'NEW123' })).not.toThrow();
  });

  it('rejects empty object (no fields)', () => {
    expectValidationError(() => validate(updateProfileSchema, {}));
  });
});

// ---------------------------------------------------------------------------
// 5. createEventSchema
// ---------------------------------------------------------------------------

describe('createEventSchema', () => {
  const validEvent = {
    name: 'Tech Fest 2026',
    description: 'A grand technology festival for all students.',
    date: '2026-12-15',
    expectedParticipants: 200,
    clubId: 'club-abc',
    clubName: 'Tech Club',
    status: 'pending_approval' as const,
  };

  it('accepts valid event data', () => {
    expect(() => validate(createEventSchema, validEvent)).not.toThrow();
  });

  it('accepts event with optional fields', () => {
    expect(() =>
      validate(createEventSchema, {
        ...validEvent,
        guestName: 'Dr. Smith',
        venue: 'C1 Auditorium',
        time: '14:00',
        organizerName: 'Tech Club',
      }),
    ).not.toThrow();
  });

  it('rejects missing event name', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, name: undefined }),
    );
  });

  it('rejects empty event name', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, name: '' }),
    );
  });

  it('rejects event name exceeding 200 chars', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, name: 'A'.repeat(201) }),
    );
  });

  it('rejects description exceeding 5000 chars', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, description: 'A'.repeat(5001) }),
    );
  });

  it('rejects invalid date format', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, date: '15-12-2026' }),
      'YYYY-MM-DD',
    );
  });

  it('rejects zero expectedParticipants', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, expectedParticipants: 0 }),
    );
  });

  it('rejects non-integer expectedParticipants', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, expectedParticipants: 10.5 }),
    );
  });

  it('rejects expectedParticipants exceeding 100,000', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, expectedParticipants: 100_001 }),
    );
  });

  it('rejects string for expectedParticipants (type violation)', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, expectedParticipants: '200' }),
    );
  });

  it('rejects invalid status', () => {
    expectValidationError(
      () => validate(createEventSchema, { ...validEvent, status: 'unknown_status' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 6. updateEventSchema
// ---------------------------------------------------------------------------

describe('updateEventSchema', () => {
  it('accepts partial updates', () => {
    expect(() => validate(updateEventSchema, { name: 'New Name' })).not.toThrow();
    expect(() => validate(updateEventSchema, {})).not.toThrow();
  });

  it('still validates field constraints', () => {
    expectValidationError(
      () => validate(updateEventSchema, { name: '' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 7. eventStatusUpdateSchema
// ---------------------------------------------------------------------------

describe('eventStatusUpdateSchema', () => {
  it('accepts valid status update', () => {
    expect(() =>
      validate(eventStatusUpdateSchema, { status: 'approved' }),
    ).not.toThrow();
  });

  it('accepts status update with feedback', () => {
    expect(() =>
      validate(eventStatusUpdateSchema, { status: 'rejected', feedback: 'Needs more details.' }),
    ).not.toThrow();
  });

  it('rejects invalid status', () => {
    expectValidationError(
      () => validate(eventStatusUpdateSchema, { status: 'maybe' }),
    );
  });

  it('rejects feedback exceeding 2000 chars', () => {
    expectValidationError(
      () => validate(eventStatusUpdateSchema, { status: 'rejected', feedback: 'A'.repeat(2001) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 8. selectVenueSchema
// ---------------------------------------------------------------------------

describe('selectVenueSchema', () => {
  it('accepts valid venue selection', () => {
    expect(() =>
      validate(selectVenueSchema, { venue: 'C1 Auditorium', time: '14:00' }),
    ).not.toThrow();
  });

  it('rejects empty venue', () => {
    expectValidationError(
      () => validate(selectVenueSchema, { venue: '', time: '14:00' }),
    );
  });

  it('rejects empty time', () => {
    expectValidationError(
      () => validate(selectVenueSchema, { venue: 'C1', time: '' }),
    );
  });

  it('rejects venue exceeding 200 chars', () => {
    expectValidationError(
      () => validate(selectVenueSchema, { venue: 'A'.repeat(201), time: '14:00' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 9. eventParticipantSchema
// ---------------------------------------------------------------------------

describe('eventParticipantSchema', () => {
  const validParticipant = {
    eventId: 'event-123',
    studentId: 'student-456',
    studentName: 'Alice',
    studentUid: 'UID001',
    studentEmail: 'alice@university.edu',
    studentBranch: 'CSE',
    studentSec: 'A',
  };

  it('accepts valid participant data', () => {
    expect(() => validate(eventParticipantSchema, validParticipant)).not.toThrow();
  });

  it('rejects invalid student email', () => {
    expectValidationError(
      () => validate(eventParticipantSchema, { ...validParticipant, studentEmail: 'not-email' }),
    );
  });

  it('rejects empty studentName', () => {
    expectValidationError(
      () => validate(eventParticipantSchema, { ...validParticipant, studentName: '' }),
    );
  });

  it('rejects studentBranch exceeding 50 chars', () => {
    expectValidationError(
      () => validate(eventParticipantSchema, { ...validParticipant, studentBranch: 'A'.repeat(51) }),
    );
  });

  it('rejects studentSec exceeding 20 chars', () => {
    expectValidationError(
      () => validate(eventParticipantSchema, { ...validParticipant, studentSec: 'A'.repeat(21) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 10. teamRegistrationSchema
// ---------------------------------------------------------------------------

describe('teamRegistrationSchema', () => {
  const member = {
    eventId: 'event-123',
    studentId: 'student-1',
    studentName: 'Alice',
    studentUid: 'UID001',
    studentEmail: 'alice@example.com',
    studentBranch: 'CSE',
    studentSec: 'A',
  };

  it('accepts a valid team', () => {
    expect(() =>
      validate(teamRegistrationSchema, [member, { ...member, studentId: 'student-2', studentEmail: 'bob@example.com' }]),
    ).not.toThrow();
  });

  it('rejects empty array', () => {
    expectValidationError(() => validate(teamRegistrationSchema, []));
  });

  it('rejects array exceeding 50 members', () => {
    const bigTeam = Array.from({ length: 51 }, (_, i) => ({
      ...member,
      studentId: `student-${i}`,
      studentEmail: `s${i}@example.com`,
    }));
    expectValidationError(() => validate(teamRegistrationSchema, bigTeam));
  });

  it('rejects team with invalid member data', () => {
    expectValidationError(() =>
      validate(teamRegistrationSchema, [{ ...member, studentEmail: 'bad-email' }]),
    );
  });
});

// ---------------------------------------------------------------------------
// 11. clubMemberSchema
// ---------------------------------------------------------------------------

describe('clubMemberSchema', () => {
  const validMember = {
    id: 'member-1',
    name: 'Dr. Smith',
    designation: 'Professor',
  };

  it('accepts valid member', () => {
    expect(() => validate(clubMemberSchema, validMember)).not.toThrow();
  });

  it('accepts member with optional fields', () => {
    expect(() =>
      validate(clubMemberSchema, { ...validMember, branch: 'CSE', year: '3rd', isPresident: true }),
    ).not.toThrow();
  });

  it('rejects empty member name', () => {
    expectValidationError(
      () => validate(clubMemberSchema, { ...validMember, name: '' }),
    );
  });

  it('rejects designation exceeding 100 chars', () => {
    expectValidationError(
      () => validate(clubMemberSchema, { ...validMember, designation: 'A'.repeat(101) }),
    );
  });
});

// ---------------------------------------------------------------------------
// 12. createClubSchema
// ---------------------------------------------------------------------------

describe('createClubSchema', () => {
  const validClub = {
    name: 'Tech Club',
    description: 'A club for technology enthusiasts.',
    facultyAdvisor: { id: 'fa-1', name: 'Dr. Smith', designation: 'Professor', isFacultyAdvisor: true },
    president: { id: 'p-1', name: 'John Doe', designation: 'President', isPresident: true },
  };

  it('accepts valid club data', () => {
    expect(() => validate(createClubSchema, validClub)).not.toThrow();
  });

  it('accepts club with core team', () => {
    expect(() =>
      validate(createClubSchema, {
        ...validClub,
        coreTeam: [{ id: 'ct-1', name: 'Alice', designation: 'Secretary' }],
      }),
    ).not.toThrow();
  });

  it('rejects missing club name', () => {
    expectValidationError(
      () => validate(createClubSchema, { ...validClub, name: undefined }),
    );
  });

  it('rejects club name exceeding 200 chars', () => {
    expectValidationError(
      () => validate(createClubSchema, { ...validClub, name: 'A'.repeat(201) }),
    );
  });

  it('rejects description exceeding 5000 chars', () => {
    expectValidationError(
      () => validate(createClubSchema, { ...validClub, description: 'A'.repeat(5001) }),
    );
  });

  it('rejects coreTeam exceeding 50 members', () => {
    const bigTeam = Array.from({ length: 51 }, (_, i) => ({
      id: `ct-${i}`,
      name: `Member ${i}`,
      designation: 'Member',
    }));
    expectValidationError(
      () => validate(createClubSchema, { ...validClub, coreTeam: bigTeam }),
    );
  });
});

// ---------------------------------------------------------------------------
// 13. updateClubSchema
// ---------------------------------------------------------------------------

describe('updateClubSchema', () => {
  it('accepts partial updates', () => {
    expect(() => validate(updateClubSchema, { name: 'New Name' })).not.toThrow();
    expect(() => validate(updateClubSchema, {})).not.toThrow();
  });

  it('still validates field constraints', () => {
    expectValidationError(
      () => validate(updateClubSchema, { name: '' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 14. postAnnouncementSchema
// ---------------------------------------------------------------------------

describe('postAnnouncementSchema', () => {
  const validAnnouncement = {
    title: 'Meeting Today',
    content: 'Please attend the club meeting at 5 PM.',
    clubId: 'club-abc',
    clubName: 'Tech Club',
    authorId: 'user-123',
    authorName: 'John Doe',
  };

  it('accepts valid announcement', () => {
    expect(() => validate(postAnnouncementSchema, validAnnouncement)).not.toThrow();
  });

  it('rejects empty title', () => {
    expectValidationError(
      () => validate(postAnnouncementSchema, { ...validAnnouncement, title: '' }),
    );
  });

  it('rejects title exceeding 300 chars', () => {
    expectValidationError(
      () => validate(postAnnouncementSchema, { ...validAnnouncement, title: 'A'.repeat(301) }),
    );
  });

  it('rejects content exceeding 10,000 chars', () => {
    expectValidationError(
      () => validate(postAnnouncementSchema, { ...validAnnouncement, content: 'A'.repeat(10_001) }),
    );
  });

  it('rejects missing authorName', () => {
    expectValidationError(
      () => validate(postAnnouncementSchema, { ...validAnnouncement, authorName: undefined }),
    );
  });
});

// ---------------------------------------------------------------------------
// 15. createNotificationSchema
// ---------------------------------------------------------------------------

describe('createNotificationSchema', () => {
  const validNotification = {
    userId: 'user-123',
    role: 'student' as const,
    message: 'Your event has been approved!',
    isRead: false,
  };

  it('accepts valid notification', () => {
    expect(() => validate(createNotificationSchema, validNotification)).not.toThrow();
  });

  it('accepts with optional relatedEventId', () => {
    expect(() =>
      validate(createNotificationSchema, { ...validNotification, relatedEventId: 'event-456' }),
    ).not.toThrow();
  });

  it('rejects empty message', () => {
    expectValidationError(
      () => validate(createNotificationSchema, { ...validNotification, message: '' }),
    );
  });

  it('rejects message exceeding 1000 chars', () => {
    expectValidationError(
      () => validate(createNotificationSchema, { ...validNotification, message: 'A'.repeat(1001) }),
    );
  });

  it('rejects invalid role', () => {
    expectValidationError(
      () => validate(createNotificationSchema, { ...validNotification, role: 'admin' }),
    );
  });

  it('rejects missing isRead', () => {
    expectValidationError(
      () => validate(createNotificationSchema, { ...validNotification, isRead: undefined }),
    );
  });

  it('rejects non-boolean isRead', () => {
    expectValidationError(
      () => validate(createNotificationSchema, { ...validNotification, isRead: 'no' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 16. notificationForUserSchema
// ---------------------------------------------------------------------------

describe('notificationForUserSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      validate(notificationForUserSchema, {
        userId: 'user-1',
        role: 'club',
        message: 'Hello!',
      }),
    ).not.toThrow();
  });

  it('rejects empty userId', () => {
    expectValidationError(
      () => validate(notificationForUserSchema, { userId: '', role: 'club', message: 'Hello!' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 17. notificationsForRoleSchema
// ---------------------------------------------------------------------------

describe('notificationsForRoleSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      validate(notificationsForRoleSchema, { role: 'department', message: 'New event pending!' }),
    ).not.toThrow();
  });

  it('rejects invalid role', () => {
    expectValidationError(
      () => validate(notificationsForRoleSchema, { role: 'superadmin', message: 'Hello!' }),
    );
  });

  it('rejects empty message', () => {
    expectValidationError(
      () => validate(notificationsForRoleSchema, { role: 'student', message: '' }),
    );
  });
});

// ---------------------------------------------------------------------------
// 18. ValidationError structure
// ---------------------------------------------------------------------------

describe('ValidationError', () => {
  it('contains fieldErrors with correct structure', () => {
    try {
      validate(loginSchema, { email: '', password: '', role: 'invalid' });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.name).toBe('ValidationError');
      expect(ve.fieldErrors).toBeDefined();
      expect(typeof ve.fieldErrors).toBe('object');
      // Should have errors for email and password at minimum
      expect(Object.keys(ve.fieldErrors).length).toBeGreaterThan(0);
    }
  });

  it('message contains "Validation failed"', () => {
    try {
      validate(firestoreIdSchema, '');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as ValidationError).message).toContain('Validation failed');
    }
  });
});

// ---------------------------------------------------------------------------
// 19. validate() returns parsed data
// ---------------------------------------------------------------------------

describe('validate() return value', () => {
  it('returns the parsed/typed data on success', () => {
    const result = validate(loginSchema, {
      email: 'test@example.com',
      password: 'secret123',
      role: 'student',
    });
    expect(result).toEqual({
      email: 'test@example.com',
      password: 'secret123',
      role: 'student',
    });
  });
});
