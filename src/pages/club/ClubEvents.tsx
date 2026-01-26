import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Clock, Eye, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { Event, VENUES } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Academic persona palette for statuses
const statusColors: Record<string, string> = {
  pending_approval: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  venue_selected: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  completed: 'bg-gray-200 text-gray-700 border border-gray-300',
};

const ClubEvents: React.FC = () => {
  const { events, selectVenue } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [venueForm, setVenueForm] = useState({ venue: '', time: '' });

  const currentClubId = user?.clubId;
  const clubEvents = events.filter(e => e.clubId === currentClubId);
  const pendingEvents = clubEvents.filter(e => e.status === 'pending_approval');
  const approvedEvents = clubEvents.filter(e => e.status === 'approved');
  const activeEvents = clubEvents.filter(e => e.status === 'venue_selected');
  const rejectedEvents = clubEvents.filter(e => e.status === 'rejected');

  const handleSelectVenue = () => {
    if (!selectedEvent || !venueForm.venue || !venueForm.time) return;

    selectVenue(selectedEvent.id, venueForm.venue, venueForm.time);

    toast({
      title: 'Venue Assigned',
      description: 'Students can now view and register for this event.',
    });

    setShowVenueDialog(false);
    setSelectedEvent(null);
    setVenueForm({ venue: '', time: '' });
  };

  // ---- Enhanced Academic Event Card ----
  const EventCard = ({ event }: { event: Event }) => (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{event.name}</h3>
            <Badge className={`text-xs tracking-wide capitalize ${statusColors[event.status]}`}>
              {event.status === 'venue_selected' ? 'Upcoming' :
                event.status === 'pending_approval' ? 'Pending Approval' :
                  event.status.replace('_', ' ').charAt(0).toUpperCase() + event.status.replace('_', ' ').slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{event.clubName}</p>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">
          <Calendar className="w-3 h-3 mr-1" />
          {format(new Date(event.date), "MMM d, yyyy")}
        </Badge>
        {event.time && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {event.time}
          </Badge>
        )}
        {event.venue && (
          <Badge variant="secondary" className="text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {event.venue}
          </Badge>
        )}
        <Badge variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {event.participants.length}/{event.expectedParticipants}
        </Badge>
      </div>

      {/* Academic Rejection Feedback */}
      {event.status === 'rejected' && event.feedback && (
        <div className="mb-4 text-xs rounded-md bg-red-50 border border-red-200 text-red-700 p-3">
          <span className="font-medium">Feedback: </span>
          {event.feedback}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{event.participants.length} participants</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedEvent(event)}>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>

          {event.status === 'approved' && (
            <Button onClick={() => { setShowVenueDialog(true); setSelectedEvent(event); }}>
              <Settings className="w-4 h-4 mr-2" />
              Assign Venue
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Academic Header */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            Club Events
          </h1>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage submissions, approvals & participation for club activities
          </p>
        </div>

        {/* Academic Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="bg-muted/40">
            <TabsTrigger value="all">All ({clubEvents.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingEvents.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedEvents.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeEvents.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedEvents.length})</TabsTrigger>
          </TabsList>

          {/* TAB: All */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {clubEvents.length > 0 ? (
              clubEvents.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <Card className="p-8 text-center rounded-xl bg-white/70 border shadow-sm">
                <p className="text-muted-foreground">No events found.</p>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Pending */}
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingEvents.length > 0 ? (
              pendingEvents.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <Card className="p-8 text-center rounded-xl bg-white/70 border shadow-sm">
                <p className="text-muted-foreground font-medium">No pending submissions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your club has no events awaiting approval.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Approved */}
          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedEvents.length > 0 ? (
              approvedEvents.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <Card className="p-8 text-center rounded-xl bg-white/70 border shadow-sm">
                <p className="text-muted-foreground font-medium">No approved events</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Approved events will appear here for venue assignment.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Active */}
          <TabsContent value="active" className="space-y-4 mt-4">
            {activeEvents.length > 0 ? (
              activeEvents.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <Card className="p-8 text-center rounded-xl bg-white/70 border shadow-sm">
                <p className="text-muted-foreground font-medium">No active events</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Events with assigned venue & time will show here.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Rejected */}
          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejectedEvents.length > 0 ? (
              rejectedEvents.map(event => <EventCard key={event.id} event={event} />)
            ) : (
              <Card className="p-8 text-center rounded-xl bg-white/70 border shadow-sm">
                <p className="text-muted-foreground font-medium">No rejected events</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Faculty feedback for rejected events will appear here.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ---- VIEW EVENT DIALOG ---- */}
      <Dialog open={!!selectedEvent && !showVenueDialog} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader className="relative pb-6 border-b border-border/50">
                <div className="grid grid-cols-1 gap-4">
                  {/* Status Badge - Top Left Position */}
                  <div className="flex items-center justify-start">
                    <div className="inline-flex items-center px-1 py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm">
                      <Badge className={`text-xs tracking-wide capitalize ${statusColors[selectedEvent.status]}`}>
                        {selectedEvent.status === 'venue_selected' ? 'Upcoming' :
                          selectedEvent.status === 'pending_approval' ? 'Pending Approval' :
                            selectedEvent.status.replace('_', ' ').charAt(0).toUpperCase() + selectedEvent.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Event Title and Organizer Info */}
                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-bold text-foreground leading-tight">
                      {selectedEvent.name}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
                      Organized by {selectedEvent.clubName || 'Your Club'}
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
                          <p className="text-sm font-semibold text-blue-700/70 mb-1">Date</p>
                          <p className="text-foreground font-medium">{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</p>
                        </div>
                      </div>

                      {selectedEvent.time && (
                        <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                          <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                            <Clock className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-700/70 mb-1">Time</p>
                            <p className="text-foreground font-medium">{selectedEvent.time}</p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.venue && (
                        <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-red-50/50 to-rose-50/50 rounded-xl border border-red-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                          <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                            <MapPin className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-700/70 mb-1">Venue</p>
                            <p className="text-foreground font-medium">{selectedEvent.venue}</p>
                          </div>
                        </div>
                      )}

                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-xl border border-purple-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-purple-700/70 mb-1">Expected Participants</p>
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
                        <div className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/50 rounded-xl border border-amber-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                              <Users className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-700/70 mb-1">Guest Speaker</p>
                              <p className="text-foreground font-medium">{selectedEvent.guestName}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rejection Feedback */}
                      {selectedEvent.status === 'rejected' && selectedEvent.feedback && (
                        <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-700 mb-1">Rejection Feedback</p>
                              <p className="text-red-600 text-sm">{selectedEvent.feedback}</p>
                            </div>
                          </div>
                        </div>
                      )}
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

      {/* ---- VENUE ASSIGNMENT DIALOG ---- */}
      <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-semibold tracking-tight">
              Assign Venue & Time
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground tracking-wide">
              Choose an appropriate venue and time slot for <strong>{selectedEvent?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm">Venue</Label>
              <Select value={venueForm.venue} onValueChange={(v) => setVenueForm(prev => ({ ...prev, venue: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {VENUES.map(venue => (
                    <SelectItem key={venue.id} value={venue.name}>
                      {venue.name} — {venue.capacity} seats
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Time</Label>
              <Input
                type="time"
                value={venueForm.time}
                onChange={(e) => setVenueForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>

            <Button className="w-full mt-2" onClick={handleSelectVenue}>
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClubEvents;
