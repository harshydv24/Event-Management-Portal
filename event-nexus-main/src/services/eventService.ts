import api from '@/api/client';
import { Event, EventParticipant } from '@/types';

/**
 * Create a new event via the backend API.
 */
export const createEvent = async (
  event: Omit<Event, 'id' | 'createdAt' | 'participants'>
): Promise<Event> => {
  const response = await api.post<{ event: Event }>('/events', event);
  return response.event;
};

/**
 * Get all events from the backend.
 */
export const getAllEvents = async (): Promise<Event[]> => {
  const response = await api.get<{ events: Event[] }>('/events');
  return response.events;
};

/**
 * Get events for a specific club.
 */
export const getEventsByClub = async (clubId: string): Promise<Event[]> => {
  const response = await api.get<{ events: Event[] }>(`/events?clubId=${clubId}`);
  return response.events;
};

/**
 * Update an existing event.
 */
export const updateEvent = async (
  eventId: string,
  updates: Partial<Event>
): Promise<void> => {
  await api.put(`/events/${eventId}`, updates);
};

/**
 * Update an event's status (approve, reject, etc.)
 */
export const updateEventStatus = async (
  eventId: string,
  status: string,
  feedback?: string
): Promise<void> => {
  await api.put(`/events/${eventId}/status`, { status, feedback });
};

/**
 * Select a venue and time for an event.
 */
export const selectVenue = async (
  eventId: string,
  venue: string,
  time: string
): Promise<void> => {
  await api.put(`/events/${eventId}/venue`, { venue, time });
};

/**
 * Delete an event.
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  await api.delete(`/events/${eventId}`);
};

/**
 * Register an individual participant for an event.
 */
export const registerForEvent = async (
  eventId: string,
  participant: Omit<EventParticipant, 'id' | 'registeredAt'>
): Promise<void> => {
  await api.post(`/events/${eventId}/register`, participant);
};

/**
 * Register a team for an event.
 */
export const registerTeamForEvent = async (
  eventId: string,
  participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
): Promise<void> => {
  await api.post(`/events/${eventId}/register-team`, { participants });
};
