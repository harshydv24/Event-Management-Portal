import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import * as eventService from '@/services/eventService';
import * as clubService from '@/services/clubService';
import * as notificationService from '@/services/notificationService';
import socketService from '@/services/socketService';
import { Event, Club, EventParticipant } from '@/types';
import { logError } from '@/lib/errorUtils';
import api from '@/api/client';

interface EventContextType {
  events: Event[];
  clubs: Club[];
  isLoading: boolean;
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'participants'>) => Promise<void>;
  updateEventStatus: (eventId: string, status: string, feedback?: string) => Promise<void>;
  registerForEvent: (eventId: string, participant: Omit<EventParticipant, 'id' | 'registeredAt'>) => Promise<void>;
  registerTeamForEvent: (eventId: string, participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]) => Promise<void>;
  selectVenue: (eventId: string, venue: string, time: string) => Promise<void>;
  getClub: (clubId: string) => Club | undefined;
  updateClub: (clubId: string, updates: Partial<Club>) => Promise<void>;
  createClub: (club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>) => Promise<Club>;
  createClubWithId: (clubId: string, club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>) => Promise<Club>;
  refreshData: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch events and clubs from the backend API.
   * Replaces the Firestore onSnapshot real-time listeners.
   */
  const fetchData = useCallback(async () => {
    try {
      const [eventsData, clubsData] = await Promise.all([
        eventService.getAllEvents(),
        clubService.getAllClubs(),
      ]);
      setEvents(eventsData);
      setClubs(clubsData);
    } catch (error) {
      logError('EventContext:fetchData', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data when user authentication state changes & connect WebSockets
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Not logged in — clear data and stop loading
        setEvents([]);
        setClubs([]);
        setIsLoading(false);
        socketService.disconnect();
        return;
      }

      // User is authenticated — fetch data from the API and authenticate socket
      fetchData();
      socketService.authenticate();
    });

    // Real-time WebSocket event listeners
    const unsubCreated = socketService.onEventCreated((newEvent) => {
      setEvents((prev) => (prev.some((e) => e.id === newEvent.id) ? prev : [newEvent, ...prev]));
    });

    const unsubUpdated = socketService.onEventUpdated((updatedEvent) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
      );
    });

    const unsubDeleted = socketService.onEventDeleted(({ id }) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    });

    const unsubClub = socketService.onClubUpdated((updatedClub) => {
      setClubs((prev) =>
        prev.map((c) => (c.id === updatedClub.id ? { ...c, ...updatedClub } : c))
      );
    });

    return () => {
      unsubAuth();
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
      unsubClub();
    };
  }, [fetchData]);

  // Periodic fallback refresh (every 60s as a safety net in case of network drops)
  useEffect(() => {
    if (!auth.currentUser) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleCreateEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt' | 'participants'>) => {
    const newEvent = await eventService.createEvent(event);
    // Notify all department users about the new event pending approval
    try {
      await notificationService.createNotificationsForRole(
        'department',
        `New event "${event.name}" submitted by ${event.clubName} for approval`,
        newEvent.id
      );
    } catch (err) {
      logError('handleCreateEvent:notification', err);
    }
    // Refresh data after creating event
    await fetchData();
  }, [fetchData]);

  const handleUpdateEventStatus = useCallback(async (eventId: string, status: string, feedback?: string) => {
    await eventService.updateEventStatus(eventId, status, feedback);
    // Find the event to get details for notification
    try {
      const event = events.find(e => e.id === eventId);
      if (event && (status === 'approved' || status === 'rejected')) {
        const statusText = status === 'approved' ? 'approved' : 'rejected';
        
        // Notify the club that owns this event
        try {
          await notificationService.notifyClub(
            event.clubId,
            `Your event "${event.name}" has been ${statusText}${feedback ? ': ' + feedback : ''}`,
            eventId
          );
        } catch (err) {
          logError('handleUpdateEventStatus:notifyClub', err);
        }

        // Also notify registered students about the status change
        const notifiedStudents = new Set<string>();
        for (const participant of event.participants) {
          if (!notifiedStudents.has(participant.studentId)) {
            notifiedStudents.add(participant.studentId);
            await notificationService.createNotificationForUser(
              participant.studentId,
              'student',
              `Event "${event.name}" has been ${statusText}`,
              eventId
            );
          }
        }
      }
    } catch (err) {
      logError('handleUpdateEventStatus:notification', err);
    }
    // Refresh data after status update
    await fetchData();
  }, [events, fetchData]);

  const handleSelectVenue = useCallback(async (eventId: string, venue: string, time: string) => {
    await eventService.selectVenue(eventId, venue, time);
    await fetchData();
  }, [fetchData]);

  const handleRegisterForEvent = useCallback(async (
    eventId: string,
    participant: Omit<EventParticipant, 'id' | 'registeredAt'>
  ) => {
    await eventService.registerForEvent(eventId, participant);
    // Notify the club owner about the new registration
    try {
      const event = events.find(e => e.id === eventId);
      if (event) {
        await notificationService.notifyClub(
          event.clubId,
          `${participant.studentName} registered for your event "${event.name}"`,
          eventId
        );
      }
    } catch (err) {
      logError('handleRegisterForEvent:notification', err);
    }
    // Refresh data after registration
    await fetchData();
  }, [events, fetchData]);

  const handleRegisterTeamForEvent = useCallback(async (
    eventId: string,
    participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
  ) => {
    await eventService.registerTeamForEvent(eventId, participants);
    await fetchData();
  }, [fetchData]);

  const getClub = useCallback((clubId: string) => {
    return clubs.find(c => c.id === clubId);
  }, [clubs]);

  const handleUpdateClub = useCallback(async (clubId: string, updates: Partial<Club>) => {
    await clubService.updateClub(clubId, updates);
    await fetchData();
  }, [fetchData]);

  const handleCreateClub = useCallback(async (club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>): Promise<Club> => {
    const newClub = await clubService.createClub(club);
    await fetchData();
    return newClub;
  }, [fetchData]);

  const handleCreateClubWithId = useCallback(async (clubId: string, club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>): Promise<Club> => {
    const newClub = await clubService.createClubWithId(clubId, club);
    await fetchData();
    return newClub;
  }, [fetchData]);

  return (
    <EventContext.Provider value={{
      events,
      clubs,
      isLoading,
      createEvent: handleCreateEvent,
      updateEventStatus: handleUpdateEventStatus,
      selectVenue: handleSelectVenue,
      registerForEvent: handleRegisterForEvent,
      registerTeamForEvent: handleRegisterTeamForEvent,
      getClub,
      updateClub: handleUpdateClub,
      createClub: handleCreateClub,
      createClubWithId: handleCreateClubWithId,
      refreshData: fetchData,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};