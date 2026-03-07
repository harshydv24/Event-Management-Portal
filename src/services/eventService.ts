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
import { Event, EventParticipant } from '@/types';

const COLLECTION = 'events';

/**
 * Create a new event in Firestore.
 */
export const createEvent = async (
  event: Omit<Event, 'id' | 'createdAt' | 'participants'>
): Promise<Event> => {
  if (!event.name?.trim()) throw new Error('Event name is required');
  if (!event.date) throw new Error('Event date is required');
  if (!event.clubId) throw new Error('Club ID is required');

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
};

/**
 * Get all events from Firestore.
 */
export const getAllEvents = async (): Promise<Event[]> => {
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
};

/**
 * Get events for a specific club.
 */
export const getEventsByClub = async (clubId: string): Promise<Event[]> => {
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
};

/**
 * Update an existing event.
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>
): Promise<void> => {
  const { id, ...updateData } = updates as Event & { id?: string };
  await updateDoc(doc(db, COLLECTION, eventId), {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update an event's status (approve, reject, etc.)
 */
export const updateEventStatus = async (
  eventId: string,
  status: string,
  feedback?: string
): Promise<void> => {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (feedback !== undefined) {
    updateData.feedback = feedback;
  }
  await updateDoc(doc(db, COLLECTION, eventId), updateData);
};

/**
 * Select a venue and time for an event.
 */
export const selectVenue = async (
  eventId: string,
  venue: string,
  time: string
): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, eventId), {
    venue,
    time,
    status: 'venue_selected',
    updatedAt: serverTimestamp(),
  });
};

/**
 * Delete an event.
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, eventId));
};

/**
 * Register an individual participant for an event.
 */
export const registerForEvent = async (
  eventId: string,
  participant: Omit<EventParticipant, 'id' | 'registeredAt'>
): Promise<void> => {
  const eventRef = doc(db, COLLECTION, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) throw new Error('Event not found');

  const eventData = eventSnap.data();
  const existingParticipants: EventParticipant[] = eventData.participants || [];

  // Check for duplicate registration
  const alreadyRegistered = existingParticipants.some(
    (p) => p.studentId === participant.studentId
  );
  if (alreadyRegistered) throw new Error('Already registered for this event');

  const newParticipant: EventParticipant = {
    ...participant,
    id: crypto.randomUUID(),
    registeredAt: new Date().toISOString(),
  };

  await updateDoc(eventRef, {
    participants: [...existingParticipants, newParticipant],
    updatedAt: serverTimestamp(),
  });
};

/**
 * Register a team for an event.
 */
export const registerTeamForEvent = async (
  eventId: string,
  participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
): Promise<void> => {
  const eventRef = doc(db, COLLECTION, eventId);
  const eventSnap = await getDoc(eventRef);

  if (!eventSnap.exists()) throw new Error('Event not found');

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
};
