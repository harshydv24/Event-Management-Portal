import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AppError } from '@/lib/errorUtils';
import { Event, EventParticipant } from '@/types';
import { withRateLimit, deviceKey } from '@/lib/rateLimiter';
import {
  validate,
  createEventSchema,
  updateEventSchema,
  eventStatusUpdateSchema,
  selectVenueSchema,
  firestoreIdSchema,
  eventParticipantSchema,
  teamRegistrationSchema,
} from '@/lib/validationSchemas';

const COLLECTION = 'events';

/**
 * Create a new event in Firestore.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const createEvent = async (
  event: Omit<Event, 'id' | 'createdAt' | 'participants'>
): Promise<Event> => {
  return withRateLimit(deviceKey('createEvent'), 'authenticated', async () => {
    // Validate the full event object against strict schema
    validate(createEventSchema, event);

    const docData = {
      ...event,
      participants: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), docData);

    return {
      ...event,
      id: docRef.id,
      participants: [],
      createdAt: new Date().toISOString(),
    };
  });
};

/**
 * Get all events from Firestore.
 *
 * Rate-limited under the **public** tier.
 */
export const getAllEvents = async (): Promise<Event[]> => {
  return withRateLimit(deviceKey('getAllEvents'), 'public', async () => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        date: data.date,
        time: data.time,
        venue: data.venue,
        expectedParticipants: data.expectedParticipants,
        guestName: data.guestName,
        poster: data.poster,
        proposalPdf: data.proposalPdf,
        m2mPdf: data.m2mPdf,
        clubId: data.clubId,
        clubName: data.clubName,
        departmentName: data.departmentName,
        organizerName: data.organizerName,
        status: data.status,
        feedback: data.feedback,
        participants: data.participants || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Event;
    });
  });
};

/**
 * Get events for a specific club.
 *
 * Rate-limited under the **public** tier.
 */
export const getEventsByClub = async (clubId: string): Promise<Event[]> => {
  // Validate clubId
  validate(firestoreIdSchema, clubId);

  return withRateLimit(deviceKey('getEventsByClub'), 'public', async () => {
    const q = query(
      collection(db, COLLECTION),
      where('clubId', '==', clubId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        participants: data.participants || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Event;
    });
  });
};

/**
 * Update an existing event.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, eventId);
  validate(updateEventSchema, updates);

  return withRateLimit(deviceKey('updateEvent'), 'authenticated', async () => {
    const { id, ...updateData } = updates as Event & { id?: string };
    await updateDoc(doc(db, COLLECTION, eventId), {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Update an event's status (approve, reject, etc.)
 *
 * Rate-limited under the **authenticated** tier.
 */
export const updateEventStatus = async (
  eventId: string,
  status: string,
  feedback?: string
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, eventId);
  validate(eventStatusUpdateSchema, { status, feedback });

  return withRateLimit(deviceKey('updateEventStatus'), 'authenticated', async () => {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (feedback !== undefined) {
      updateData.feedback = feedback;
    }
    await updateDoc(doc(db, COLLECTION, eventId), updateData);
  });
};

/**
 * Select a venue and time for an event.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const selectVenue = async (
  eventId: string,
  venue: string,
  time: string
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, eventId);
  validate(selectVenueSchema, { venue, time });

  return withRateLimit(deviceKey('selectVenue'), 'authenticated', async () => {
    await updateDoc(doc(db, COLLECTION, eventId), {
      venue,
      time,
      status: 'venue_selected',
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Delete an event.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  // Validate eventId
  validate(firestoreIdSchema, eventId);

  return withRateLimit(deviceKey('deleteEvent'), 'authenticated', async () => {
    await deleteDoc(doc(db, COLLECTION, eventId));
  });
};

/**
 * Register an individual participant for an event.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const registerForEvent = async (
  eventId: string,
  participant: Omit<EventParticipant, 'id' | 'registeredAt'>
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, eventId);
  validate(eventParticipantSchema, participant);

  return withRateLimit(deviceKey('registerForEvent'), 'authenticated', async () => {
    const eventRef = doc(db, COLLECTION, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new AppError('Event not found', 'The event you are looking for is no longer available.');

    const eventData = eventSnap.data();
    const existingParticipants: EventParticipant[] = eventData.participants || [];

    // Check for duplicate registration
    const alreadyRegistered = existingParticipants.some(
      (p) => p.studentId === participant.studentId
    );
    if (alreadyRegistered) throw new AppError('Duplicate registration', 'You are already registered for this event.');

    const newParticipant: EventParticipant = {
      ...participant,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    };

    await updateDoc(eventRef, {
      participants: [...existingParticipants, newParticipant],
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Register a team for an event.
 *
 * Rate-limited under the **authenticated** tier.
 */
export const registerTeamForEvent = async (
  eventId: string,
  participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
): Promise<void> => {
  // Validate inputs
  validate(firestoreIdSchema, eventId);
  validate(teamRegistrationSchema, participants);

  return withRateLimit(deviceKey('registerTeamForEvent'), 'authenticated', async () => {
    const eventRef = doc(db, COLLECTION, eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) throw new AppError('Event not found', 'The event you are looking for is no longer available.');

    const eventData = eventSnap.data();
    const existingParticipants: EventParticipant[] = eventData.participants || [];

    const newParticipants: EventParticipant[] = participants.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    }));

    await updateDoc(eventRef, {
      participants: [...existingParticipants, ...newParticipants],
      updatedAt: serverTimestamp(),
    });
  });
};
