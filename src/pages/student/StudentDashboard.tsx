import React, { useState } from 'react';
import { useEvents } from '@/contexts/EventContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import EventCard from '@/components/EventCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Users, User, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '@/types';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { events = [], registerForEvent } = useEvents();

  const { user } = useAuth();

  const { toast } = useToast();
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({ uid: '', email: '' });

  // Get registered and upcoming events
  const registeredEvents = events.filter(e =>
    e.participants.some(p => p.studentId === user?.id)
  );

  const upcomingEvents = events.filter(e =>
    e.status === 'venue_selected' &&
    !e.participants.some(p => p.studentId === user?.id)
  );

  const handleRegister = () => {
    if (!selectedEvent || !user) return;
    
    registerForEvent(selectedEvent.id, {
      eventId: selectedEvent.id,
      studentId: user.id,
      studentName: user.name,
      studentUid: registrationData.uid || user.uid || '',
      studentEmail: registrationData.email || user.email,
    });

    toast({
      title: 'Registration Successful!',
      description: `You have registered for ${selectedEvent.name}`,
    });

    setShowRegistration(false);
    setSelectedEvent(null);
    setRegistrationData({ uid: '', email: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-student/10 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-student" />
              </div>
              <div>
                <p className="text-2xl font-bold">{registeredEvents.length}</p>
                <p className="text-sm text-muted-foreground">Registered Events</p>
              </div>
            </div>
          </Card>
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </Card>
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Registered Events */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">My Registered Events</h2>
          {registeredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={() => setSelectedEvent(event)}
                  showActions={true}
                  variant="student"
                  isRegistered={true}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">You haven't registered for any events yet.</p>
            </Card>
          )}
        </section>

        {/* Upcoming Events */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  onViewDetails={() => setSelectedEvent(event)}
                  onRegister={() => {
                    setSelectedEvent(event);
                    setShowRegistration(true);
                  }}
                  showActions={true}
                  variant="student"
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No upcoming events at the moment.</p>
            </Card>
          )}
        </section>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent && !showRegistration} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.name}</DialogTitle>
                <DialogDescription>Organized by {selectedEvent.clubName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedEvent.poster && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={selectedEvent.poster}
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-muted-foreground">{selectedEvent.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>{format(new Date(selectedEvent.date), 'MMMM d, yyyy')}</span>
                  </div>
                  {selectedEvent.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <span>{selectedEvent.time}</span>
                    </div>
                  )}
                  {selectedEvent.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span>{selectedEvent.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span>{selectedEvent.participants.length} / {selectedEvent.expectedParticipants} registered</span>
                  </div>
                  {selectedEvent.guestName && (
                    <div className="flex items-center gap-2 col-span-2">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span>Guest: {selectedEvent.guestName}</span>
                    </div>
                  )}
                </div>
                {selectedEvent.status === 'venue_selected' && 
                 !selectedEvent.participants.some(p => p.studentId === user?.id) && (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowRegistration(true)}
                  >
                    Register for this Event
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Registration Dialog */}
      <Dialog open={showRegistration} onOpenChange={setShowRegistration}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Registration</DialogTitle>
            <DialogDescription>
              Register for {selectedEvent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-uid">University ID (UID)</Label>
              <Input
                id="reg-uid"
                placeholder="Enter your UID"
                value={registrationData.uid}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, uid: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="Enter your email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleRegister}>
              Confirm Registration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StudentDashboard;