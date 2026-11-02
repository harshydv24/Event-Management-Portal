/**
 * Strict Input Validation Schemas
 *
 * Centralized Zod schemas for every service-layer entry point.
 * All inputs are validated against strict type, length, and format rules.
 * Invalid data is **rejected** (throws ValidationError), never silently
 * sanitized or coerced.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Custom error class
// ---------------------------------------------------------------------------

export class ValidationError extends Error {
  /** Per-field error messages (key = field path, value = messages). */
  public readonly fieldErrors: Record<string, string[]>;

  constructor(fieldErrors: Record<string, string[]>) {
    const summary = Object.entries(fieldErrors)
      .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
      .join('; ');
    super(`Validation failed — ${summary}`);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

// ---------------------------------------------------------------------------
// validate() helper
// ---------------------------------------------------------------------------

/**
 * Parse `data` against a Zod schema. Returns the validated, typed result.
 * Throws `ValidationError` if validation fails.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const fieldErrors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  throw new ValidationError(fieldErrors);
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Firestore document ID — non-empty, no whitespace, 1–128 chars. */
export const firestoreIdSchema = z
  .string({ required_error: 'ID is required' })
  .min(1, 'ID must not be empty')
  .max(128, 'ID must be at most 128 characters')
  .regex(/^\S+$/, 'ID must not contain whitespace');

/** Valid email address, max 254 chars (RFC 5321). */
const emailSchema = z
  .string({ required_error: 'Email is required' })
  .min(1, 'Email must not be empty')
  .max(254, 'Email must be at most 254 characters')
  .email('Invalid email format');

/** User role enum. */
const userRoleSchema = z.enum(['student', 'club', 'department'], {
  required_error: 'Role is required',
  invalid_type_error: 'Role must be one of: student, club, department',
});

/** Event status enum. */
const eventStatusSchema = z.enum(
  ['pending_approval', 'approved', 'rejected', 'venue_selected', 'completed'],
  {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid event status',
  },
);

/** Human name — 1–100 chars, no leading/trailing whitespace. */
const nameSchema = z
  .string({ required_error: 'Name is required' })
  .min(1, 'Name must not be empty')
  .max(100, 'Name must be at most 100 characters')
  .regex(/^\S.*\S$|^\S$/, 'Name must not have leading or trailing whitespace');

/**
 * Optional URL or data-URI string. Used for poster, PDF links, logos, etc.
 * Maximum 10 MB of base64 data (~13.3 million chars) to prevent payload abuse.
 */
const optionalUrlOrDataUri = z
  .string()
  .max(14_000_000, 'File data is too large (max ~10 MB)')
  .optional();

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),
  role: userRoleSchema,
});

export const signupSchema = loginSchema.extend({
  name: nameSchema,
  universityId: z
    .string()
    .max(50, 'University ID must be at most 50 characters')
    .regex(/^[a-zA-Z0-9]*$/, 'University ID must be alphanumeric')
    .optional(),
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    uid: z
      .string()
      .min(1, 'UID must not be empty')
      .max(50, 'UID must be at most 50 characters')
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.uid !== undefined, {
    message: 'At least one field (name or uid) must be provided',
  });

// ---------------------------------------------------------------------------
// Event schemas
// ---------------------------------------------------------------------------

export const createEventSchema = z.object({
  name: z
    .string({ required_error: 'Event name is required' })
    .min(1, 'Event name must not be empty')
    .max(200, 'Event name must be at most 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description must not be empty')
    .max(5000, 'Description must be at most 5000 characters'),
  date: z
    .string({ required_error: 'Date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z
    .string()
    .max(50, 'Time must be at most 50 characters')
    .optional(),
  venue: z
    .string()
    .max(200, 'Venue must be at most 200 characters')
    .optional(),
  expectedParticipants: z
    .number({ required_error: 'Expected participants is required', invalid_type_error: 'Expected participants must be a number' })
    .int('Expected participants must be a whole number')
    .min(1, 'Expected participants must be at least 1')
    .max(100_000, 'Expected participants must be at most 100,000'),
  guestName: z
    .string()
    .max(200, 'Guest name must be at most 200 characters')
    .optional(),
  poster: optionalUrlOrDataUri,
  proposalPdf: optionalUrlOrDataUri,
  m2mPdf: optionalUrlOrDataUri,
  clubId: z
    .string({ required_error: 'Club ID is required' })
    .min(1, 'Club ID must not be empty'),
  clubName: z
    .string({ required_error: 'Club name is required' })
    .min(1, 'Club name must not be empty')
    .max(200, 'Club name must be at most 200 characters'),
  departmentName: z
    .string()
    .max(200, 'Department name must be at most 200 characters')
    .optional(),
  organizerName: z
    .string()
    .max(200, 'Organizer name must be at most 200 characters')
    .optional(),
  status: eventStatusSchema,
  feedback: z
    .string()
    .max(2000, 'Feedback must be at most 2000 characters')
    .optional(),
});

export const updateEventSchema = createEventSchema.partial();

export const eventStatusUpdateSchema = z.object({
  status: eventStatusSchema,
  feedback: z
    .string()
    .max(2000, 'Feedback must be at most 2000 characters')
    .optional(),
});

export const selectVenueSchema = z.object({
  venue: z
    .string({ required_error: 'Venue is required' })
    .min(1, 'Venue must not be empty')
    .max(200, 'Venue must be at most 200 characters'),
  time: z
    .string({ required_error: 'Time is required' })
    .min(1, 'Time must not be empty')
    .max(50, 'Time must be at most 50 characters'),
});

export const eventParticipantSchema = z.object({
  eventId: z
    .string({ required_error: 'Event ID is required' })
    .min(1, 'Event ID must not be empty'),
  studentId: z
    .string({ required_error: 'Student ID is required' })
    .min(1, 'Student ID must not be empty'),
  studentName: z
    .string({ required_error: 'Student name is required' })
    .min(1, 'Student name must not be empty')
    .max(100, 'Student name must be at most 100 characters'),
  studentUid: z
    .string({ required_error: 'Student UID is required' })
    .min(1, 'Student UID must not be empty')
    .max(50, 'Student UID must be at most 50 characters'),
  studentEmail: emailSchema,
  studentBranch: z
    .string({ required_error: 'Branch is required' })
    .min(1, 'Branch must not be empty')
    .max(50, 'Branch must be at most 50 characters'),
  studentSec: z
    .string({ required_error: 'Section is required' })
    .min(1, 'Section must not be empty')
    .max(20, 'Section must be at most 20 characters'),
});

export const teamRegistrationSchema = z
  .array(eventParticipantSchema)
  .min(1, 'At least one team member is required')
  .max(50, 'A team cannot have more than 50 members');

// ---------------------------------------------------------------------------
// Club schemas
// ---------------------------------------------------------------------------

export const clubMemberSchema = z.object({
  id: z.string().min(1, 'Member ID must not be empty'),
  name: nameSchema,
  designation: z
    .string({ required_error: 'Designation is required' })
    .min(1, 'Designation must not be empty')
    .max(100, 'Designation must be at most 100 characters'),
  branch: z.string().max(50, 'Branch must be at most 50 characters').optional(),
  year: z.string().max(20, 'Year must be at most 20 characters').optional(),
  photo: optionalUrlOrDataUri,
  isPresident: z.boolean().optional(),
  isFacultyAdvisor: z.boolean().optional(),
});

export const createClubSchema = z.object({
  name: z
    .string({ required_error: 'Club name is required' })
    .min(1, 'Club name must not be empty')
    .max(200, 'Club name must be at most 200 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description must not be empty')
    .max(5000, 'Description must be at most 5000 characters'),
  logo: optionalUrlOrDataUri,
  facultyAdvisor: clubMemberSchema,
  president: clubMemberSchema,
  coreTeam: z
    .array(clubMemberSchema)
    .max(50, 'Core team cannot have more than 50 members')
    .default([]),
});

export const updateClubSchema = createClubSchema.partial();

// ---------------------------------------------------------------------------
// Announcement schemas
// ---------------------------------------------------------------------------

export const postAnnouncementSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(1, 'Title must not be empty')
    .max(300, 'Title must be at most 300 characters'),
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content must not be empty')
    .max(10_000, 'Content must be at most 10,000 characters'),
  clubId: z
    .string({ required_error: 'Club ID is required' })
    .min(1, 'Club ID must not be empty'),
  clubName: z
    .string({ required_error: 'Club name is required' })
    .min(1, 'Club name must not be empty')
    .max(200, 'Club name must be at most 200 characters'),
  authorId: z
    .string({ required_error: 'Author ID is required' })
    .min(1, 'Author ID must not be empty'),
  authorName: z
    .string({ required_error: 'Author name is required' })
    .min(1, 'Author name must not be empty')
    .max(100, 'Author name must be at most 100 characters'),
});

// ---------------------------------------------------------------------------
// Notification schemas
// ---------------------------------------------------------------------------

export const createNotificationSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .min(1, 'User ID must not be empty'),
  role: userRoleSchema,
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message must not be empty')
    .max(1000, 'Message must be at most 1000 characters'),
  relatedEventId: z.string().min(1, 'Related event ID must not be empty').optional(),
  isRead: z.boolean({ required_error: 'isRead is required' }),
});

export const notificationForUserSchema = z.object({
  userId: z
    .string({ required_error: 'User ID is required' })
    .min(1, 'User ID must not be empty'),
  role: userRoleSchema,
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message must not be empty')
    .max(1000, 'Message must be at most 1000 characters'),
  relatedEventId: z.string().min(1, 'Related event ID must not be empty').optional(),
});

export const notificationsForRoleSchema = z.object({
  role: userRoleSchema,
  message: z
    .string({ required_error: 'Message is required' })
    .min(1, 'Message must not be empty')
    .max(1000, 'Message must be at most 1000 characters'),
  relatedEventId: z.string().min(1, 'Related event ID must not be empty').optional(),
});
