import { CalendarCheck, Hourglass, CheckCircle2, XCircle, Search } from "lucide-react";
import { type LucideIcon } from "lucide-react";



import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, Users, MapPin, Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { useEvents } from "@/contexts/EventContext";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@/types";

type TabType = "all" | "pending" | "approved" | "rejected";

const DepartmentDashboard: React.FC = () => {
  const { events, updateEventStatus } = useEvents();
  const { toast } = useToast();
  const location = useLocation();

  const isClubsPage = location.pathname === "/department/clubs";

  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredClubs = useMemo(() => {
    if (!searchQuery) return clubStats;
    return clubStats.filter(club =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clubStats, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (activeTab === "pending") return events.filter(e => e.status === "pending_approval");
    if (activeTab === "approved") return events.filter(e => e.status === "approved" || e.status === "venue_selected");
    if (activeTab === "rejected") return events.filter(e => e.status === "rejected");
    return events;
  }, [events, activeTab]);

  const handleApprove = async (ev: Event) => {
    try {
      await updateEventStatus(ev.id, 'approved');
      toast({ title: "Approved", description: `${ev.name} approved successfully` });
    } catch (error) {
      console.error('Approval failed:', error);
      toast({ title: "Error", description: "Failed to approve event", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!selectedEvent) return;
    try {
      await updateEventStatus(selectedEvent.id, 'rejected', feedback);
      toast({ title: "Rejected", description: "Feedback sent to club" });
      setRejectOpen(false);
      setFeedback("");
      setSelectedEvent(null);
    } catch (error) {
      console.error('Rejection failed:', error);
      toast({ title: "Error", description: "Failed to reject event", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div key={location.pathname} className="space-y-8 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold">{isClubsPage ? "Registered Clubs" : "Events Approval"}</h1>
          <p className="text-muted-foreground">{isClubsPage ? "Overview of all registered clubs and their event activity" : "Department Management Portal"}</p>
        </div>

        {/* Stats - shown only on events page */}
        {!isClubsPage && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              label="Total Events"
              value={stats.total}
              colorType="primary"
              icon={CalendarCheck}
            />
            <StatCard
              label="Pending Review"
              value={stats.pending}
              colorType="warning"
              icon={Hourglass}
            />
            <StatCard
              label="Approved"
              value={stats.approved}
              colorType="success"
              icon={CheckCircle2}
            />
            <StatCard
              label="Rejected"
              value={stats.rejected}
              colorType="destructive"
              icon={XCircle}
            />
            <StatCard
              label="Registered Clubs"
              value={clubStats.length}
              colorType="purple"
              icon={Users}
            />
          </div>
        )}


        {/* Events Tabs - shown only on events page */}
        {!isClubsPage && (
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabType)}>
            <TabsList className="surface-translucent-4 border border-subtle">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-2 space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(ev => (
                  <Card key={ev.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ev.name}</h3>
                          <StatusBadge status={ev.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(ev.date), "MMM d, yyyy")}
                      </Badge>
                      {ev.time && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {ev.time}
                        </Badge>
                      )}
                      {ev.venue && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ev.venue}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {ev.participants?.length || 0}/{ev.expectedParticipants}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{ev.organizerName || ev.clubName || 'Unknown Organizer'}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setSelectedEvent(ev); setIsViewDialogOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {ev.status === "pending_approval" && (
                          <>
                            <Button
                              variant="outline"
                              className="bg-success/15 text-success border-success/20 hover:bg-success/25 hover:text-success hover:border-success/30 transition-colors"
                              onClick={() => handleApprove(ev)}
                            >
                              <Check className="w-4 h-4 mr-2" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25 hover:text-destructive hover:border-destructive/30 transition-colors"
                              onClick={() => { setSelectedEvent(ev); setRejectOpen(true); }}
                            >
                              <X className="w-4 h-4 mr-2" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No events found.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="mt-2 space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(ev => (
                  <Card key={ev.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ev.name}</h3>
                          <StatusBadge status={ev.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(ev.date), "MMM d, yyyy")}
                      </Badge>
                      {ev.time && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {ev.time}
                        </Badge>
                      )}
                      {ev.venue && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ev.venue}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {ev.participants?.length || 0}/{ev.expectedParticipants}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{ev.organizerName || ev.clubName || 'Unknown Organizer'}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setSelectedEvent(ev); setIsViewDialogOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-success/15 text-success border-success/20 hover:bg-success/25 hover:text-success hover:border-success/30 transition-colors"
                          onClick={() => handleApprove(ev)}
                        >
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-destructive/15 text-destructive border-destructive/20 hover:bg-destructive/25 hover:text-destructive hover:border-destructive/30 transition-colors"
                          onClick={() => { setSelectedEvent(ev); setRejectOpen(true); }}
                        >
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No pending events to review.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-2 space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(ev => (
                  <Card key={ev.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ev.name}</h3>
                          <StatusBadge status={ev.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(ev.date), "MMM d, yyyy")}
                      </Badge>
                      {ev.time && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {ev.time}
                        </Badge>
                      )}
                      {ev.venue && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ev.venue}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {ev.participants?.length || 0}/{ev.expectedParticipants}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{ev.organizerName || ev.clubName || 'Unknown Organizer'}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setSelectedEvent(ev); setIsViewDialogOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No approved events.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-2 space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(ev => (
                  <Card key={ev.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{ev.name}</h3>
                          <StatusBadge status={ev.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{ev.departmentName || ev.clubName}</p>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(ev.date), "MMM d, yyyy")}
                      </Badge>
                      {ev.time && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {ev.time}
                        </Badge>
                      )}
                      {ev.venue && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {ev.venue}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {ev.participants?.length || 0}/{ev.expectedParticipants}
                      </Badge>
                    </div>

                    {ev.feedback && (
                      <div className="mb-4 text-xs rounded-md surface-translucent-2 border border-border text-muted-foreground p-3">
                        <span className="font-medium">Rejection Feedback: </span>
                        {ev.feedback}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{ev.organizerName || ev.clubName || 'Unknown Organizer'}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setSelectedEvent(ev); setIsViewDialogOpen(true); }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No rejected events.</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Clubs Content - shown only on clubs page */}
        {isClubsPage && (
          <div className="space-y-6">
            {/* Total Clubs Summary */}
            <Card className="p-6 surface-translucent-2 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">All Registered Clubs</h3>
                  <p className="text-muted-foreground mt-1">Complete overview of all active clubs and their event activity</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary">{clubStats.length}</div>
                  <p className="text-sm text-muted-foreground">Total Clubs</p>
                </div>
              </div>
            </Card>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search clubs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clubs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club, index) => (
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
                        <div className="surface-translucent-2 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-foreground">{club.totalEvents}</div>
                          <div className="text-xs text-muted-foreground font-emphasis">Total Events</div>
                        </div>
                        <div className="surface-translucent-2 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-foreground">{club.approvedEvents}</div>
                          <div className="text-xs text-muted-foreground font-emphasis">Approved</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="surface-translucent-2 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-foreground">{club.pendingEvents}</div>
                          <div className="text-xs text-muted-foreground font-emphasis">Pending</div>
                        </div>
                        <div className="surface-translucent-2 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold text-foreground">{club.rejectedEvents}</div>
                          <div className="text-xs text-muted-foreground font-emphasis">Rejected</div>
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

            {filteredClubs.length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No clubs found.</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => { setIsViewDialogOpen(open); if (!open) setSelectedEvent(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader className="relative pb-6 border-b border-border/50">
                <div className="grid grid-cols-1 gap-4">
                  {/* Status Badge - Top Left Position */}
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-1 py-1 rounded-full surface-translucent-2 border border-border">
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
                      <div className="w-1 h-6 bg-primary rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Event Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="group flex items-center gap-4 p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="p-2 surface-translucent-3 rounded-lg transition-colors">
                          <Calendar className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-emphasis text-muted-foreground mb-1">Date</p>
                          <p className="text-foreground font-medium">{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="p-2 surface-translucent-3 rounded-lg transition-colors">
                          <Clock className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-emphasis text-muted-foreground mb-1">Time</p>
                          <p className="text-foreground font-medium">{selectedEvent.time}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="p-2 surface-translucent-3 rounded-lg transition-colors">
                          <MapPin className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-emphasis text-muted-foreground mb-1">Venue</p>
                          <p className="text-foreground font-medium">{selectedEvent.venue}</p>
                        </div>
                      </div>

                      <div className="group flex items-center gap-4 p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="p-2 surface-translucent-3 rounded-lg transition-colors">
                          <Users className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-emphasis text-muted-foreground mb-1">Expected Participants</p>
                          <p className="text-foreground font-medium">{selectedEvent.expectedParticipants}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Additional Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                    </div>
                    <div className="space-y-4">
                      {selectedEvent.guestName && (
                        <div className="p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 surface-translucent-3 rounded-lg">
                              <Users className="w-4 h-4 text-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-emphasis text-muted-foreground mb-1">Guest Speaker</p>
                              <p className="text-foreground font-medium">{selectedEvent.guestName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-4 surface-translucent-2 rounded-xl border border-border hover:shadow-md transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 surface-translucent-3 rounded-lg">
                            <Users className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-emphasis text-muted-foreground mb-1">Organizer</p>
                            <p className="text-foreground font-medium">{selectedEvent.organizerName || selectedEvent.clubName || 'Unknown Organizer'}</p>
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
                      <div className="w-1 h-6 bg-primary rounded-full"></div>
                      <h3 className="text-lg font-semibold text-foreground">Registered Participants</h3>
                    </div>
                    <div className="inline-flex items-center px-4 py-2 surface-translucent-3 text-foreground rounded-full text-sm font-semibold border border-border">
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
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{participant.studentName}</p>
                                <p className="text-sm text-muted-foreground">{participant.studentEmail}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="inline-flex items-center px-3 py-1 surface-translucent-2 text-foreground rounded-md text-xs font-emphasis">
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mr-2"></span>
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
      <Dialog open={rejectOpen} onOpenChange={(open) => {
        setRejectOpen(open);
        if (!open) setSelectedEvent(null);
      }}>
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

const StatCard = ({
  label,
  value,
  colorType = "primary",
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number | string;
  colorType?: "primary" | "success" | "warning" | "destructive" | "purple";
  icon: LucideIcon;
  onClick?: () => void;
}) => {
  const colorStyles = {
    primary: {
      card: "bg-primary/5 border-primary/20",
      iconBox: "bg-primary/15 border border-primary/20 text-primary",
      text: "text-primary",
    },
    success: {
      card: "bg-success/5 border-success/20",
      iconBox: "bg-success/15 border border-success/20 text-success",
      text: "text-success",
    },
    warning: {
      card: "bg-warning/5 border-warning/20",
      iconBox: "bg-warning/15 border border-warning/20 text-warning",
      text: "text-warning",
    },
    destructive: {
      card: "bg-destructive/5 border-destructive/20",
      iconBox: "bg-destructive/15 border border-destructive/20 text-destructive",
      text: "text-destructive",
    },
    purple: {
      card: "bg-purple/5 border-purple/20",
      iconBox: "bg-purple/15 border border-purple/20 text-purple",
      text: "text-purple",
    },
  };

  const style = colorStyles[colorType] || colorStyles.primary;

  return (
    <Card 
      className={`p-5 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${style.card} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.iconBox}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col">
          <span className={`font-mono text-2xl font-semibold ${style.text}`}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </div>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending_approval: 'bg-warning/15 text-warning border border-warning/20',
    approved: 'bg-success/15 text-success border border-success/20',
    venue_selected: 'bg-primary/10 text-primary/80 border border-primary/15',
    rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
    completed: 'bg-muted text-muted-foreground border border-border',
  };

  const labels: Record<string, string> = {
    pending_approval: 'Pending Approval',
    approved: 'Approved',
    venue_selected: 'Upcoming',
    rejected: 'Rejected',
    completed: 'Completed',
  };

  return (
    <Badge className={`text-xs tracking-wide capitalize ${styles[status] || 'bg-muted text-muted-foreground border border-border'}`}>
      {labels[status] || status.replace('_', ' ')}
    </Badge>
  );
};