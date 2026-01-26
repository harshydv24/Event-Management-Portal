import React, { useState, useEffect, useRef } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Calendar,
  Users,
  Trophy,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Clock,
  Pencil
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Club } from '@/types';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const monthLabel = (date: string) => format(new Date(date), 'MMM yyyy');

const fallbackMembers = [
  { name: "Yogesh Kumamr", designation: "Secretary", branch: "CSE", year: "3rd" },
  { name: "Disha K", designation: "Joint Secretary", branch: "ECE", year: "3rd" },
  { name: "Simran Kaur", designation: "UI/UX Designer", branch: "CSE", year: "2nd" },
  { name: "Rohit Sharma", designation: "Events Head", branch: "ME", year: "3rd" },
  { name: "Neha Gupta", designation: "Media Lead", branch: "CSE", year: "3rd" },
  { name: "Aman Verma", designation: "CSE Student", branch: "CSE", year: "2nd" },
  { name: "Jasleen Kaur", designation: "Planning Head", branch: "ECE", year: "3rd" },
  { name: "Rohit Gupta", designation: "Co Events Head", branch: "ME", year: "2nd" },
  { name: "Naina", designation: "PR Head", branch: "CSE", year: "3rd" },
  { name: "Disha", designation: "Research Lead", branch: "ECE", year: "2nd" },
];

const ClubDashboard: React.FC = () => {
  const { events, clubs, createClub, updateClub } = useEvents();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', uid: '', branch: '', year: '', designation: '' });
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const [isScrollPaused, setIsScrollPaused] = useState(false);

  const marqueeRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Pause auto-scroll temporarily
    setIsScrollPaused(true);

    // Check if we're near the start - if so, teleport to middle first
    if (container.scrollLeft < 300) {
      // Teleport to the middle section (instant jump)
      const middlePosition = container.scrollWidth / 3;
      container.scrollLeft = middlePosition;
    }

    // Smooth scroll left
    container.scrollBy({
      left: -280,
      behavior: 'smooth'
    });

    // Resume auto-scroll after a delay
    setTimeout(() => {
      setIsScrollPaused(false);
    }, 2000);
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Pause auto-scroll temporarily
    setIsScrollPaused(true);

    // Check if we're near the end - if so, teleport to middle first
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (container.scrollLeft > maxScroll - 300) {
      // Teleport to the middle section (instant jump)
      const middlePosition = container.scrollWidth / 3;
      container.scrollLeft = middlePosition;
    }

    // Smooth scroll right
    container.scrollBy({
      left: 280,
      behavior: 'smooth'
    });

    // Resume auto-scroll after a delay
    setTimeout(() => {
      setIsScrollPaused(false);
    }, 2000);
  };

  useEffect(() => {
    let existingClub = clubs.find(c => c.id === user?.clubId);

    if (!existingClub && user?.clubId) {
      existingClub = createClub({
        name: `${user.name}'s Club`,
        description: 'Welcome to our club! Update this description to tell everyone about your club.',
        facultyAdvisor: {
          id: crypto.randomUUID(),
          name: 'Faculty Advisor',
          designation: 'Professor',
          isFacultyAdvisor: true,
        },
        president: {
          id: crypto.randomUUID(),
          name: user.name,
          designation: 'President',
          isPresident: true,
        },
        coreTeam: [],
      });
    }

    setClub(existingClub || clubs[0] || null);
  }, [user, clubs, createClub]);

  if (!club) return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading club information...</p>
        </Card>
      </div>
    </DashboardLayout>
  );

  const currentClubId = user?.clubId;
  const clubEvents = events.filter(e => e.clubId === currentClubId);
  const pendingEvents = clubEvents.filter(e => e.status === 'pending_approval');
  const completedEvents = clubEvents.filter(e => e.status === 'completed');
  const totalParticipants = clubEvents.reduce((sum, e) => sum + e.participants.length, 0);

  const groupedEvents = clubEvents.reduce((acc, event) => {
    const m = monthLabel(event.date);
    if (!acc[m]) acc[m] = [];
    acc[m].push(event);
    return acc;
  }, {} as Record<string, typeof clubEvents>);

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Soft Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,white,rgba(240,240,240,0.6))]" />

        {/* Header */}
        <div className="flex flex-col space-y-1 mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {club.name} — CUSB
          </h1>
          <span className="text-sm text-slate-600 tracking-wide">
            University Club Portal
          </span>
        </div>

        {/* Overview Section */}
        <section className="space-y-4 mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
            Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Events",
                value: clubEvents.length,
                subtitle: "+2 this semester",
                icon: Calendar
              },
              {
                label: "Pending Submissions",
                value: pendingEvents.length,
                subtitle: "Awaiting department",
                icon: Clock
              },
              {
                label: "Completed Events",
                value: completedEvents.length,
                subtitle: "Well executed",
                icon: Trophy
              },
              {
                label: "Total Participants",
                value: totalParticipants,
                subtitle: "Avg: ~70/event",
                icon: TrendingUp
              }
            ].map((stat, i) => (
              <Card
                key={i}
                className="
                p-5 rounded-xl border border-slate-200 bg-white 
                shadow-[0_4px_10px_rgba(0,0,0,0.04)]
                hover:shadow-[0_6px_14px_rgba(0,0,0,0.08)]
                transition duration-200
              "
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-slate-700" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </span>
                    <span className="text-sm text-slate-600">{stat.label}</span>
                    <span className="text-xs text-amber-600 tracking-wide mt-1">
                      {stat.subtitle}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* People Section */}
        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
            People
          </h2>
          <p className="text-s text-slate-500 tracking-wide">
            Leadership & core management team
          </p>

          <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-8 shadow-sm">

            {/* Leadership Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
                Leadership
              </h3>
              <div className="flex items-center gap-1 text-s text-slate-500">
                <Users className="w-4 h-4" />
                <span>2</span>
              </div>
            </div>

            {/* Leadership Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[club.facultyAdvisor, club.president].map((leader, index) => {
                const initials = leader.name
                  .split(" ")
                  .map(s => s[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const role = leader.isFacultyAdvisor
                  ? "Faculty Advisor"
                  : "Club President";
                const roleColor = leader.isFacultyAdvisor
                  ? "border-amber-500"
                  : "border-blue-500";

                return (
                  <Card
                    key={index}
                    className="
                    flex items-center justify-between gap-4 px-5 py-4
                    rounded-xl bg-white border border-slate-200
                    shadow-[0_4px_10px_rgba(0,0,0,0.04)]
                    hover:shadow-[0_6px_14px_rgba(0,0,0,0.05)]
                    transition
                  "
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`absolute inset-0 rounded-full border-[3px] ${roleColor}`}></div>
                        <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-medium shadow-sm">
                          {initials}
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="font-semibold tracking-tight text-slate-900">
                          {leader.name}
                        </span>
                        <span className="text-xs text-slate-600">{role}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] tracking-wide px-2 py-[1px] mt-1 border-slate-300 w-fit"
                        >
                          {leader.designation}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

          </div>
        </section>
        <br />

        <div className="space-y-8">

          {/* Core Team Scrolling */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-800">Core Team</h2>
              <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Add Team Members <Pencil className="w-4 h-4 ml-1" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Enter the details of the new team member.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" placeholder="Enter full name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="uid">UID *</Label>
                        <Input id="uid" placeholder="Enter university ID" value={newMember.uid} onChange={(e) => setNewMember({ ...newMember, uid: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="branch">Branch *</Label>
                        <Input id="branch" placeholder="e.g. CSE, ECE" value={newMember.branch} onChange={(e) => setNewMember({ ...newMember, branch: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="year">Year *</Label>
                        <Input id="year" placeholder="e.g. 1st, 2nd" value={newMember.year} onChange={(e) => setNewMember({ ...newMember, year: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="designation">Designation *</Label>
                      <Input id="designation" placeholder="e.g. Secretary, Events Head" value={newMember.designation} onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      if (newMember.name && newMember.uid && newMember.branch && newMember.year && newMember.designation) {
                        const member = {
                          id: crypto.randomUUID(),
                          name: newMember.name,
                          designation: newMember.designation,
                          branch: newMember.branch,
                          year: newMember.year,
                        };
                        const updatedCoreTeam = [...club.coreTeam, member];
                        updateClub(club.id, { coreTeam: updatedCoreTeam });
                        setClub(prevClub => {
                          if (!prevClub) return null;
                          return { ...prevClub, coreTeam: updatedCoreTeam };
                        });
                        setNewMember({ name: '', uid: '', branch: '', year: '', designation: '' });
                        setIsAddMemberOpen(false);
                      }
                    }}>Add Member</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Core Team Scrolling */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
              </div>

              <div
                className="relative py-2"
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
              >
                {/* Left Button - Fade in/out on hover */}
                <button
                  onClick={scrollLeft}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-full p-2.5 hover:bg-white hover:scale-110 transition-all duration-300 ${isCarouselHovered
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-2 pointer-events-none'
                    }`}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div
                  ref={scrollContainerRef}
                  className="overflow-x-auto scrollbar-hide"
                  style={{
                    maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                >
                  <div
                    ref={marqueeRef}
                    className="flex gap-6 whitespace-nowrap py-2 animate-scroll"
                    style={{
                      animationPlayState: (isCarouselHovered || isScrollPaused) ? 'paused' : 'running'
                    }}
                    key={club.coreTeam.length}
                  >
                    {(club.coreTeam && club.coreTeam.length > 0
                      ? [...club.coreTeam, ...club.coreTeam, ...club.coreTeam]
                      : [...fallbackMembers, ...fallbackMembers]
                    ).map((m, i) => {
                      const initials = m.name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);

                      return (
                        <Card
                          key={i}
                          className="inline-flex flex-col justify-between min-w-[220px] max-w-[220px]
                            backdrop-blur-sm bg-white/70 border rounded-xl px-4 py-5 shadow
                            hover:shadow-xl hover:-translate-y-[2px] hover:scale-[1.03]
                            transition duration-200 cursor-pointer flex-shrink-0"
                        >
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center rounded-full text-sm font-medium shadow">
                              {initials}
                            </div>
                          </div>

                          <div className="text-center space-y-1">
                            <div className="font-medium tracking-tight text-[15px]">{m.name}</div>
                            <Badge variant="outline" className="text-[10px] tracking-wide px-2 py-[1px]">
                              {m.designation}
                            </Badge>
                            {(m.branch || m.year) && (
                              <div className="text-[11px] text-slate-600 mt-1 font-medium">
                                {m.branch && m.year ? `${m.branch} ${m.year}` : m.branch || m.year}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Right Button - Fade in/out on hover */}
                <button
                  onClick={scrollRight}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md shadow-lg rounded-full p-2.5 hover:bg-white hover:scale-110 transition-all duration-300 ${isCarouselHovered
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-2 pointer-events-none'
                    }`}
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </div>
            </section>
          </section>

          {/* Timeline Events */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-800">Event Timeline</h2>
              </div>
              <Link to="/club/events">
                <Button variant="outline" size="sm">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <Card className="p-0 shadow-sm rounded-xl border bg-white overflow-hidden">
              {Object.keys(groupedEvents).length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {Object.entries(groupedEvents).map(([month, events], groupIndex) => (
                    <div key={month} className="p-6">
                      {/* Month Header */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-indigo-600 text-sm uppercase tracking-wider">
                          {month}
                        </h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-indigo-100 to-transparent" />
                      </div>

                      {/* Events List */}
                      <div className="relative ml-4">
                        {/* Timeline Line */}
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent" />

                        <div className="space-y-4">
                          {events.map((event, eventIndex) => (
                            <div
                              key={event.id}
                              className="relative pl-6 group"
                            >
                              {/* Timeline Dot */}
                              <div className="absolute left-[-5px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm bg-indigo-500" />

                              {/* Event Card */}
                              <div className="p-4 rounded-lg bg-slate-50/50 border border-slate-100">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    {/* Event Name */}
                                    <h4 className="font-medium text-slate-800">
                                      {event.name}
                                    </h4>

                                    {/* Event Meta */}
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(new Date(event.date), 'MMM d, yyyy')}
                                      </span>
                                      {event.venue && (
                                        <>
                                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                          <span className="inline-flex items-center gap-1">
                                            <span className="text-slate-400">📍</span>
                                            {event.venue}
                                          </span>
                                        </>
                                      )}
                                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                      <span className="inline-flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5" />
                                        {event.participants.length} registered
                                      </span>
                                    </div>
                                  </div>

                                  {/* Status Badge */}
                                  <Badge
                                    className={`shrink-0 text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full ${event.status === 'pending_approval'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : event.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : event.status === 'venue_selected'
                                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                          : event.status === 'rejected'
                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                                      }`}
                                  >
                                    {event.status === 'pending_approval'
                                      ? 'Pending'
                                      : event.status === 'venue_selected'
                                        ? 'Upcoming'
                                        : event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium text-slate-700 mb-1">No events yet</h3>
                  <p className="text-sm text-slate-500">
                    Create your first event to get started!
                  </p>
                </div>
              )}
            </Card>
          </section>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClubDashboard;
