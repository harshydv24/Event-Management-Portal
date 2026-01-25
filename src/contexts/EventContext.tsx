import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventParticipant, Club, ClubMember } from '@/types';

interface EventContextType {
  events: Event[];
  clubs: Club[];
  createEvent: (event: Omit<Event, 'id' | 'createdAt' | 'participants'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  approveEvent: (id: string) => void;
  rejectEvent: (id: string, feedback: string) => void;
  selectVenue: (eventId: string, venue: string, time: string) => void;
  registerForEvent: (eventId: string, participant: Omit<EventParticipant, 'id' | 'registeredAt'>) => void;
  registerTeamForEvent: (eventId: string, participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]) => void;
  getClub: (clubId: string) => Club | undefined;
  updateClub: (clubId: string, updates: Partial<Club>) => void;
  createClub: (club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>) => Club;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

const EVENTS_KEY = 'eventPortal_events';
const CLUBS_KEY = 'eventPortal_clubs';

// Sample data for demo
const sampleClubs: Club[] = [
  {
    id: 'club-1',
    name: 'Tech Innovators Club',
    description: 'A club dedicated to exploring and innovating with cutting-edge technology. We organize hackathons, workshops, and tech talks.',
    facultyAdvisor: {
      id: 'fa-1',
      name: 'Dr. Sarah Mitchell',
      designation: 'Associate Professor, Computer Science',
      isFacultyAdvisor: true,
    },
    president: {
      id: 'pres-1',
      name: 'Alex Johnson',
      designation: 'President',
      isPresident: true,
    },
    coreTeam: [
      { id: 'ct-1', name: 'Emily Chen', designation: 'Vice President' },
      { id: 'ct-2', name: 'Michael Brown', designation: 'Technical Lead' },
      { id: 'ct-3', name: 'Jessica Lee', designation: 'Event Coordinator' },
      { id: 'ct-4', name: 'David Wilson', designation: 'Marketing Head' },
    ],
    eventsCount: 12,
    createdAt: '2023-01-15',
  },
];

const sampleEvents: Event[] = [
  {
    id: 'event-1',
    name: 'Annual Hackathon 2024',
    description: 'A 24-hour coding competition where students build innovative solutions to real-world problems.',
    date: '2024-03-15',
    time: '09:00 AM',
    venue: 'C1 Auditorium',
    expectedParticipants: 200,
    guestName: 'John Smith, CTO TechCorp',
    clubId: 'club-1',
    clubName: 'Tech Innovators Club',
    status: 'venue_selected',
    participants: [],
    createdAt: '2024-01-10',
  },
  {
    id: 'event-2',
    name: 'AI Workshop Series',
    description: 'A hands-on workshop series covering machine learning fundamentals and practical applications.',
    date: '2024-04-01',
    expectedParticipants: 100,
    clubId: 'club-1',
    clubName: 'Tech Innovators Club',
    status: 'pending_approval',
    participants: [],
    createdAt: '2024-02-01',
  },
];

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    const storedEvents = localStorage.getItem(EVENTS_KEY);
    const storedClubs = localStorage.getItem(CLUBS_KEY);
    
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      setEvents(sampleEvents);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(sampleEvents));
    }

    if (storedClubs) {
      setClubs(JSON.parse(storedClubs));
    } else {
      setClubs(sampleClubs);
      localStorage.setItem(CLUBS_KEY, JSON.stringify(sampleClubs));
    }
  }, []);

  const saveEvents = (newEvents: Event[]) => {
    setEvents(newEvents);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(newEvents));
  };

  const saveClubs = (newClubs: Club[]) => {
    setClubs(newClubs);
    localStorage.setItem(CLUBS_KEY, JSON.stringify(newClubs));
  };

  const createEvent = (event: Omit<Event, 'id' | 'createdAt' | 'participants'>) => {
    const newEvent: Event = {
      ...event,
      id: crypto.randomUUID(),
      participants: [],
      createdAt: new Date().toISOString(),
    };
    saveEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<Event>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...updates } : e);
    saveEvents(updated);
  };

  const approveEvent = (id: string) => {
    updateEvent(id, { status: 'approved' });
  };

  const rejectEvent = (id: string, feedback: string) => {
    updateEvent(id, { status: 'rejected', feedback });
  };

  const selectVenue = (eventId: string, venue: string, time: string) => {
    updateEvent(eventId, { venue, time, status: 'venue_selected' });
  };

  const registerForEvent = (
    eventId: string,
    participant: Omit<EventParticipant, 'id' | 'registeredAt'>
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newParticipant: EventParticipant = {
      ...participant,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    };

    updateEvent(eventId, {
      participants: [...event.participants, newParticipant],
    });
  };

  const registerTeamForEvent = (
    eventId: string,
    participants: Omit<EventParticipant, 'id' | 'registeredAt'>[]
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newParticipants: EventParticipant[] = participants.map(participant => ({
      ...participant,
      id: crypto.randomUUID(),
      registeredAt: new Date().toISOString(),
    }));

    updateEvent(eventId, {
      participants: [...event.participants, ...newParticipants],
    });
  };

  const getClub = (clubId: string) => clubs.find(c => c.id === clubId);

  const updateClub = (clubId: string, updates: Partial<Club>) => {
    const updated = clubs.map(c => c.id === clubId ? { ...c, ...updates } : c);
    saveClubs(updated);
  };

  const createClub = (club: Omit<Club, 'id' | 'createdAt' | 'eventsCount'>): Club => {
    const newClub: Club = {
      ...club,
      id: crypto.randomUUID(),
      eventsCount: 0,
      createdAt: new Date().toISOString(),
    };
    saveClubs([...clubs, newClub]);
    return newClub;
  };

  return (
    <EventContext.Provider value={{
      events,
      clubs,
      createEvent,
      updateEvent,
      approveEvent,
      rejectEvent,
      selectVenue,
      registerForEvent,
      registerTeamForEvent,
      getClub,
      updateClub,
      createClub,
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