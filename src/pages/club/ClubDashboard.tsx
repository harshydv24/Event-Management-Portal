import React, { useState, useEffect } from 'react';
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

const ClubDashboard: React.FC = () => {
  const { events, clubs, createClub, updateClub } = useEvents();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', uid: '', branch: '', year: '' });

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

  const clubEvents = events.filter(e => e.clubId === club?.id);
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-800">
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-800">
          People
        </h2>
        <p className="text-xs text-slate-500 tracking-wide">
          Leadership & core management team
        </p>

        <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-8 shadow-sm">

          {/* Leadership Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
              Leadership
            </h3>
            <span className="text-xs text-slate-500">2 Members</span>
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
                        className="text-[10px] tracking-wide px-2 py-[1px] mt-1 border-slate-300"
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
            <h2 className="text-2xl font-semibold tracking-tight">Core Team</h2>
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
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="uid">UID</Label>
                    <Input id="uid" value={newMember.uid} onChange={(e) => setNewMember({...newMember, uid: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" value={newMember.branch} onChange={(e) => setNewMember({...newMember, branch: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input id="year" value={newMember.year} onChange={(e) => setNewMember({...newMember, year: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    if (newMember.name && newMember.uid && newMember.branch && newMember.year) {
                      const member = {
                        id: crypto.randomUUID(),
                        name: newMember.name,
                        designation: `${newMember.uid} - ${newMember.branch} ${newMember.year}`,
                      };
                      updateClub(club.id, { coreTeam: [...club.coreTeam, member] });
                      setNewMember({ name: '', uid: '', branch: '', year: '' });
                      setIsAddMemberOpen(false);
                    }
                  }}>Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-hidden group relative py-2"
            style={{
              maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
            }}
          >
            <div className="flex gap-6 whitespace-nowrap animate-scroll group-hover:[animation-play-state:paused]">

              {(club.coreTeam && club.coreTeam.length > 0
                ? [...club.coreTeam, ...club.coreTeam]
                : [
                    { name: "Yogesh Kumamr", designation: "Secretary" },
                    { name: "Disha K", designation: "Joint Secretary" },
                    { name: "Simran Kaur", designation: "UI/UX Designer" },
                    { name: "Rohit Sharma", designation: "Events Head" },
                    { name: "Neha Gupta", designation: "Media Lead" },
                    { name: "Aman Verma", designation: "CSE Student" },
                    { name: "Jasleen Kaur", designation: "Planning Head" },
                    { name: "Rohit Gupta", designation: "Co Events Head" },
                    { name: "Naina", designation: "PR Head" },
                    { name: "Disha", designation: "Research Lead" },
                  ]).map((m, i) => {
                const initials = m.name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);

                return (
                  <Card
                    key={i}
                    className="inline-flex flex-col justify-between min-w-[220px] max-w-[220px]
                    backdrop-blur-sm bg-white/70 border rounded-xl px-4 py-5 shadow
                    hover:shadow-xl hover:-translate-y-[2px] hover:scale-[1.03]
                    transition duration-200 cursor-pointer"
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
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Timeline Events */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Event Timeline</h2>
            <Link to="/club/events">
              <Button variant="outline" size="sm">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="p-6 shadow-sm rounded-xl border bg-white">
            {Object.keys(groupedEvents).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedEvents).map(([month, events]) => (
                  <div key={month}>
                    <h3 className="font-medium text-indigo-600 mb-2 tracking-wide">{month}</h3>
                    <div className="border-l pl-4 space-y-4 border-indigo-200">
                      {events.map(event => (
                        <div key={event.id} className="relative flex flex-col gap-1">
                          <span className="absolute -left-[9px] top-1 w-3 h-3 bg-indigo-600 rounded-full shadow"></span>
                          <span className="font-medium tracking-tight">{event.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.date), 'MMM d, yyyy')}
                            {event.venue && ` • ${event.venue}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              event.status === 'pending_approval' ? 'secondary' :
                              event.status === 'approved' ? 'default' :
                              event.status === 'venue_selected' ? 'default' :
                              event.status === 'rejected' ? 'destructive' : 'outline'
                            } className="text-[10px] tracking-wide px-2 py-[1px]">
                              {event.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.participants.length} participants
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6 text-sm">
                No events yet. Create your first event!
              </p>
            )}
          </Card>
        </section>

      </div>
    </DashboardLayout>
  );
};

export default ClubDashboard;
