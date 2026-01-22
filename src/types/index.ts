export type UserRole = 'student' | 'club' | 'department';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  uid?: string; // For students
  clubId?: string; // For club users
}

export interface ClubMember {
  id: string;
  name: string;
  designation: string;
  branch?: string;
  year?: string;
  photo?: string;
  isPresident?: boolean;
  isFacultyAdvisor?: boolean;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo?: string;
  facultyAdvisor: ClubMember;
  president: ClubMember;
  coreTeam: ClubMember[];
  eventsCount: number;
  createdAt: string;
}

export type EventStatus = 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'venue_selected'
  | 'completed';

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  expectedParticipants: number;
  guestName?: string;
  poster?: string;
  proposalPdf?: string;
  m2mPdf?: string;
  clubId: string;
  clubName: string;
  status: EventStatus;
  feedback?: string;
  participants: EventParticipant[];
  createdAt: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  studentUid: string;
  studentEmail: string;
  registeredAt: string;
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  available: boolean;
}

export const VENUES: Venue[] = [
  { id: 'c1-audi', name: 'C1 Auditorium', capacity: 500, available: true },
  { id: 'c3-audi', name: 'C3 Auditorium', capacity: 300, available: true },
  { id: 'b1', name: 'B1 Hall', capacity: 150, available: true },
  { id: 'd7', name: 'D7 Conference Room', capacity: 80, available: true },
  { id: 'open-air', name: 'Open Air Theatre', capacity: 1000, available: true },
  { id: 'seminar-hall', name: 'Seminar Hall', capacity: 200, available: true },
];