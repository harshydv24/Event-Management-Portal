import { CalendarCheck, Hourglass, CheckCircle2, XCircle } from "lucide-react";
import { type LucideIcon } from "lucide-react";



import React, { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, Users, MapPin, Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { useEvents } from "@/contexts/EventContext";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/types";

type TabType = "all" | "pending" | "approved" | "rejected" | "clubs";

const DepartmentDashboard: React.FC = () => {
  const { events, approveEvent, rejectEvent } = useEvents();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  const stats = useMemo(() => {
    const pending = events.filter(e => e.status === "pending_approval");
    const approved = events.filter(e => e.status === "approved" || e.status === "venue_selected");
    const rejected = events.filter(e => e.status === "rejected");
    return {
      total: events.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
    };
  }, [events]);

  const clubStats = useMemo(() => {
    const clubMap = new Map<string, { name: string; totalEvents: number; pendingEvents: number; approvedEvents: number; rejectedEvents: number; }>();
    
    events.forEach(event => {
      const clubName = event.clubName || event.departmentName || 'Unknown Club';
      if (!clubMap.has(clubName)) {
        clubMap.set(clubName, {
          name: clubName,
          totalEvents: 0,
          pendingEvents: 0,
          approvedEvents: 0,
          rejectedEvents: 0,
        });
      }
      
      const club = clubMap.get(clubName)!;
      club.totalEvents++;
      
      if (event.status === "pending_approval") club.pendingEvents++;
      else if (event.status === "approved" || event.status === "venue_selected") club.approvedEvents++;
      else if (event.status === "rejected") club.rejectedEvents++;
    });
    
    return Array.from(clubMap.values()).sort((a, b) => b.totalEvents - a.totalEvents);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeTab === "pending") return events.filter(e => e.status === "pending_approval");
    if (activeTab === "approved") return events.filter(e => e.status === "approved" || e.status === "venue_selected");
    if (activeTab === "rejected") return events.filter(e => e.status === "rejected");
    return events;
  }, [events, activeTab]);

  const handleApprove = (ev: Event) => {
    approveEvent(ev.id);
    toast({ title: "Approved", description: `${ev.name} approved successfully` });
  };

  const handleReject = () => {
    if (!selectedEvent) return;
    rejectEvent(selectedEvent.id, feedback);
    toast({ title: "Rejected", description: "Feedback sent to club" });
    setRejectOpen(false);
    setFeedback("");
    setSelectedEvent(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">Events Approval</h1>
          <p className="text-muted-foreground">Department Management Portal</p>
        </div>

        {/* Stats */}
       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
  <StatCard
    label="Total Events"
    value={stats.total}
    color="text-blue-600"
    icon={CalendarCheck}
  />
  <StatCard
    label="Pending Review"
    value={stats.pending}
    color="text-amber-600"
    icon={Hourglass}
  />
  <StatCard
    label="Approved"
    value={stats.approved}
    color="text-green-600"
    icon={CheckCircle2}
  />
  <StatCard
    label="Rejected"
    value={stats.rejected}
    color="text-red-600"
    icon={XCircle}
  />
  <StatCard
    label="Registered Clubs"
    value={clubStats.length}
    color="text-purple-600"
    icon={Users}
    onClick={() => setActiveTab("clubs")}
  />
</div>


        {/* Filters */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabType)}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            <TabsTrigger value="clubs">All Registered Clubs ({clubStats.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(ev => (
                <Card key={ev.id} className="p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                      <h3 className="text-lg font-semibold mt-1">{ev.name}</h3>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{ev.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(ev.date), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ev.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ev.venue}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{ev.expectedParticipants}</span>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">
                      <p className="font-medium">{ev.organizerName || 'Unknown Organizer'}</p>
                      <p className="text-muted-foreground">Organizer</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(ev)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {ev.status === "pending_approval" && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprove(ev)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedEvent(ev); setRejectOpen(true); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No events found.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(ev => (
                <Card key={ev.id} className="p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                      <h3 className="text-lg font-semibold mt-1">{ev.name}</h3>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{ev.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(ev.date), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ev.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ev.venue}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{ev.expectedParticipants}</span>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">
                      <p className="font-medium">{ev.organizerName || 'Unknown Organizer'}</p>
                      <p className="text-muted-foreground">Organizer</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(ev)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {ev.status === "pending_approval" && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprove(ev)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => { setSelectedEvent(ev); setRejectOpen(true); }}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No pending events to review.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(ev => (
                <Card key={ev.id} className="p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                      <h3 className="text-lg font-semibold mt-1">{ev.name}</h3>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{ev.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(ev.date), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ev.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ev.venue}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{ev.expectedParticipants}</span>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">
                      <p className="font-medium">{ev.organizerName || 'Unknown Organizer'}</p>
                      <p className="text-muted-foreground">Organizer</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(ev)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No approved events.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(ev => (
                <Card key={ev.id} className="p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                      <h3 className="text-lg font-semibold mt-1">{ev.name}</h3>
                    </div>
                    <StatusBadge status={ev.status} />
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{ev.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(ev.date), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{ev.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{ev.venue}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{ev.expectedParticipants}</span>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm">
                      <p className="font-medium">{ev.organizerName || 'Unknown Organizer'}</p>
                      <p className="text-muted-foreground">Organizer</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedEvent(ev)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No rejected events.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clubs" className="mt-2">
            <div className="space-y-6">
              {/* Total Clubs Summary */}
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900">All Registered Clubs</h3>
                    <p className="text-blue-700 mt-1">Complete overview of all active clubs and their event activity</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600">{clubStats.length}</div>
                    <p className="text-sm text-blue-500">Total Clubs</p>
                  </div>
                </div>
              </Card>

              {/* Clubs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubStats.map((club, index) => (
                  <Card key={club.name} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="space-y-4">
                      {/* Club Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary border-2 border-primary/20">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{club.name}</h3>
                          <p className="text-sm text-muted-foreground">Registered Club</p>
                        </div>
                      </div>

                      {/* Event Statistics */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-blue-600">{club.totalEvents}</div>
                            <div className="text-xs text-blue-500 font-medium">Total Events</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{club.approvedEvents}</div>
                            <div className="text-xs text-green-500 font-medium">Approved</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-amber-600">{club.pendingEvents}</div>
                            <div className="text-xs text-amber-500 font-medium">Pending</div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-red-600">{club.rejectedEvents}</div>
                            <div className="text-xs text-red-500 font-medium">Rejected</div>
                          </div>
                        </div>
                      </div>

                      {/* Activity Status */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Activity Status</span>
                          <Badge variant={club.totalEvents > 0 ? "success" : "secondary"}>
                            {club.totalEvents > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {clubStats.length === 0 && (
                <Card className="col-span-full p-8 text-center">
                  <p className="text-muted-foreground">No clubs found.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedEvent && !rejectOpen} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader className="relative pb-6 border-b border-border/50">
                <div className="grid grid-cols-1 gap-4">
                  {/* Status Badge - Top Left Position */}
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                      <StatusBadge status={selectedEvent.status} />
                    </div>
                  </div>

                  {/* Event Title and Organizer Info */}
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-bold text-foreground leading-tight">
                      {selectedEvent.name}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
                      Organized by {selectedEvent.clubName || selectedEvent.departmentName || 'Unknown Club'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8 mt-8">
                {/* Description Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h3 className="text-lg font-semibold text-foreground">Event Description</h3>
                  </div>
                  <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-6 border border-border/30 shadow-sm">
                    <p className="text-muted-foreground leading-relaxed text-base">{selectedEvent.description}</p>
                  </div>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Event Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Event Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700/70 mb-1">Date</p>
                          <p className="text-foreground font-medium">{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                          <Clock className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700/70 mb-1">Time</p>
                          <p className="text-foreground font-medium">{selectedEvent.time}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-red-50/50 to-rose-50/50 rounded-xl border border-red-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                          <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-700/70 mb-1">Venue</p>
                          <p className="text-foreground font-medium">{selectedEvent.venue}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-xl border border-purple-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-700/70 mb-1">Expected Participants</p>
                          <p className="text-foreground font-medium">{selectedEvent.expectedParticipants}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Additional Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                    </div>
                    <div className="space-y-4">
                      {selectedEvent.guestName && (
                        <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100/50 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Users className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-700/70 mb-1">Guest Speaker</p>
                              <p className="text-foreground font-semibold">{selectedEvent.guestName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-gradient-to-r from-slate-50/50 to-gray-50/50 rounded-xl border border-slate-100/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <Users className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700/70 mb-1">Organizer</p>
                            <p className="text-foreground font-medium">{selectedEvent.organizerName || 'Unknown Organizer'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Registered Participants</h3>
                    </div>
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-semibold border border-green-200 shadow-sm">
                      <Users className="w-4 h-4 mr-2" />
                      {selectedEvent.participants.length} registered
                    </div>
                  </div>

                  {selectedEvent.participants.length > 0 ? (
                    <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl p-6 border border-border/30 shadow-sm max-h-80 overflow-y-auto">
                      <div className="space-y-3">
                        {selectedEvent.participants.map((participant, index) => (
                          <div key={participant.id} className="group flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-border/40 hover:shadow-md hover:bg-background transition-all duration-200 hover:scale-[1.01]">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                                  {index + 1}
                                </div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background"></div>
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{participant.studentName}</p>
                                <p className="text-sm text-muted-foreground">{participant.studentEmail}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mr-2"></span>
                                UID: {participant.studentUid}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-muted/20 to-muted/5 rounded-xl p-8 border border-border/30 shadow-sm text-center">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h4 className="text-lg font-medium text-muted-foreground mb-2">No participants yet</h4>
                      <p className="text-sm text-muted-foreground/70">Participants will appear here once they register for the event</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>Provide feedback</DialogDescription>
          </DialogHeader>
          <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} />
          <Button variant="destructive" onClick={handleReject}>Reject Event</Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DepartmentDashboard;

// const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
//   <Card className="p-6">
//     <p className={`text-3xl font-bold ${color}`}>{value}</p>
//     <p className="text-muted-foreground mt-1">{label}</p>
//   </Card>
// );

const StatCard = ({
  label,
  value,
  color,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  icon: LucideIcon;
  onClick?: () => void;
}) => (
  <Card className={`p-6 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition' : ''}`} onClick={onClick}>
    <div className="p-3 rounded-lg bg-muted">
      <Icon className={`w-6 h-6 ${color}`} />
    </div>

    <div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-muted-foreground mt-1">{label}</p>
    </div>
  </Card>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, "secondary" | "success" | "destructive" | "warning"> = {
    pending_approval: "warning",
    approved: "success",
    venue_selected: "success",
    rejected: "destructive",
  };
  return <Badge variant={map[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  
};