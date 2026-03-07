import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import * as eventService from '@/services/eventService';
import * as clubService from '@/services/clubService';
import { Event, Club, EventParticipant } from '@/types';

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
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Start onSnapshot listeners only AFTER user is authenticated
  useEffect(() => {
    let unsubEvents: (() => void) | null = null;
    let unsubClubs: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous listeners when auth state changes
      if (unsubEvents) { unsubEvents(); unsubEvents = null; }
      if (unsubClubs) { unsubClubs(); unsubClubs = null; }

      if (!firebaseUser) {
        // Not logged in — clear data and stop loading
        setEvents([]);
        setClubs([]);
        setIsLoading(false);
        return;
      }

      // User is authenticated — start real-time listeners
      const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      unsubEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventsData = snapshot.docs.map((docSnap) => {
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
        setEvents(eventsData);
        setIsLoading(false);
      }, (error) => {
        console.error('Error listening to events:', error);
        setIsLoading(false);
      });

      const clubsQuery = query(collection(db, 'clubs'), orderBy('createdAt', 'desc'));
      unsubClubs = onSnapshot(clubsQuery, (snapshot) => {
        const clubsData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            description: data.description,
            logo: data.logo,
            facultyAdvisor: data.facultyAdvisor,
            president: data.president,
            coreTeam: data.coreTeam || [],
            eventsCount: data.eventsCount || 0,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as Club;
        });
        setClubs(clubsData);
      }, (error) => {
        console.error('Error listening to clubs:', error);
      });
    });

    return () => {
      unsubAuth();
      if (unsubEvents) unsubEvents();
      if (unsubClubs) unsubClubs();
    };
  }, []);

  const handleCreateEvent = useCallback(async (event: Omit<Event, 'id' | 'createdAt' | 'participants'>) => {
    await eventService.createEvent(event);
  }, []);

  const handleUpdateEventStatus = useCallback(async (eventId: string, status: string, feedback?: string) => {
    await eventService.updateEventStatus(eventId, status, feedback);
  }, []);

  const handleSelectVenue = useCallback(async (eventId: string, venue: string, time: string) => {
    await eventService.selectVenue(eventId, venue, time);
  }, []);

  const handleRegisterForEvent = useCallback(async (
    eventId: string,
    participant: Omit<EventParticipant, 'id' | 'registeredAt'>
  ) => {
    await eventService.registerForEvent(eventId, participant);
  }, []);

  const handleRegisterTeamForEvent = useCallback(async (
    eventId: string,
    participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
  ) => {
    await eventService.registerTeamForEvent(eventId, participants);
  }, []);

  const getClub = useCallback((clubId: string) => {
    return clubs.find(c => c.id === clubId);
  }, [clubs]);

  const handleUpdateClub = useCallback(async (clubId: string, updates: Partial<Club>) => {
    await clubService.updateClub(clubId, updates);
  }, []);

  const handleCreateClub = useCallback(async (club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>): Promise<Club> => {
    const newClub = await clubService.createClub(club);
    return newClub;
  }, []);

  const handleCreateClubWithId = useCallback(async (clubId: string, club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>): Promise<Club> => {
    const newClub = await clubService.createClubWithId(clubId, club);
    return newClub;
  }, []);

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