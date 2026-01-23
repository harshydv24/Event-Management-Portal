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

  const clubEvents = events.filter(e => e.clubId === user?.clubId || e.clubId === 'club-1');
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
    <Card className="p-5 rounded-2xl bg-white/80 backdrop-blur border shadow-sm hover:shadow-md hover:-translate-y-[2px] transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* <span className="w-2 h-2 rounded-full bg-indigo-500 mt-[0px]" /> */}
          <h3 className="font-bold tracking-tight text-[18px]">
            {event.name}
          </h3>
        </div>

        <Badge className={`text-xs tracking-wide capitalize ${statusColors[event.status]}`}>
          {event.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {format(new Date(event.date), 'MMM d, yyyy')}
        </div>

        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {event.participants.length} registered  
        </div>

        {event.venue && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {event.venue}
          </div>
        )}

        {event.time && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {event.time}
          </div>
        )}
      </div>

      {/* Academic Rejection Feedback */}
      {event.status === 'rejected' && event.feedback && (
        <div className="mt-3 text-xs rounded-md bg-red-50 border border-red-200 text-red-700 p-2">
          <span className="font-medium">Feedback: </span>
          {event.feedback}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
          <Eye className="w-4 h-4 mr-1" /> View
        </Button>

        {event.status === 'approved' && (
          <Button size="sm" onClick={() => { setShowVenueDialog(true); setSelectedEvent(event); }}>
            <Settings className="w-4 h-4 mr-1" /> Assign Venue
          </Button>
        )}
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
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  {selectedEvent.name}
                </DialogTitle>
                <DialogDescription className="text-xs tracking-wide">
                  Event Details & Participants
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Description */}
                <div>
                  <h4 className="font-medium text-sm tracking-tight">Description</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedEvent.description}
                  </p>
                </div>

                {/* Meta Grid */}
                <div>
                  <h4 className="font-medium text-sm tracking-tight mb-2">Event Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Date:</strong> {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}</div>
                    <div><strong>Expected:</strong> {selectedEvent.expectedParticipants} participants</div>
                    {selectedEvent.venue && <div><strong>Venue:</strong> {selectedEvent.venue}</div>}
                    {selectedEvent.time && <div><strong>Time:</strong> {selectedEvent.time}</div>}
                    {selectedEvent.guestName && (
                      <div className="col-span-2"><strong>Guest:</strong> {selectedEvent.guestName}</div>
                    )}
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <h4 className="font-medium text-sm tracking-tight mb-2">
                    Participants ({selectedEvent.participants.length})
                  </h4>

                  {selectedEvent.participants.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {selectedEvent.participants.map((p, i) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="font-medium text-sm">
                            {i + 1}. {p.studentName}
                            <span className="text-muted-foreground ml-1 text-xs">({p.studentUid})</span>
                          </span>
                          <span className="text-xs text-muted-foreground">{p.studentEmail}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs">No registrations yet.</p>
                  )}
                </div>

                {/* Rejection Feedback (Optional) */}
                {selectedEvent.status === 'rejected' && selectedEvent.feedback && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-md p-3 text-xs">
                    <strong>Reason:</strong> {selectedEvent.feedback}
                  </div>
                )}
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
