import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Calendar, MapPin, Clock, Users, User, Ticket, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Event, VENUES } from '@/types';
import { useToast } from '@/hooks/use-toast';

const StudentDashboard: React.FC = () => {
  const { events = [], registerForEvent } = useEvents();

  const { user } = useAuth();

  const { toast } = useToast();
  
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({ uid: '', email: '', branch: '', sec: '' });

  // ESC key handler for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showRegistration) {
          setShowRegistration(false);
        } else if (selectedEvent) {
          setSelectedEvent(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showRegistration, selectedEvent]);

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

    // Validate all required fields
    const uid = registrationData.uid || user.uid || '';
    const email = registrationData.email || user.email || '';
    const branch = registrationData.branch.trim();
    const sec = registrationData.sec.trim();

    if (!uid || !email || !branch || !sec) {
      toast({
        title: 'Registration Failed',
        description: 'Please fill in all required fields (UID, Email, Branch, and Section)',
        variant: 'destructive',
      });
      return;
    }

    registerForEvent(selectedEvent.id, {
      eventId: selectedEvent.id,
      studentId: user.id,
      studentName: user.name,
      studentUid: uid,
      studentEmail: email,
      studentBranch: branch,
      studentSec: sec,
    });

    toast({
      title: 'Registration Successful!',
      description: `You have registered for ${selectedEvent.name}`,
    });

    setShowRegistration(false);
    setSelectedEvent(null);
    setRegistrationData({ uid: '', email: '', branch: '', sec: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-black">{registeredEvents.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Registered Events</p>
              </div>
            </div>
          </Card>
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-black">{upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Upcoming Events</p>
              </div>
            </div>
          </Card>
          <Card className="stat-card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-black">{events.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Total Events</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Registered Events */}
        <section>
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">My Registered Events</h2>
          {registeredEvents.length > 0 ? (
            <div className="space-y-4">
              {registeredEvents.map(event => (
                <Card key={event.id} className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          ✓ Registered
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
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {event.venue}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {event.participants.length}/{event.expectedParticipants}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{event.organizerName || event.clubName}</span>
                    </div>

                    <Button
                      onClick={() => setSelectedEvent(event)}
                      className="shadow-sm"
                      title="View detailed event information"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </Card>
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
            <Card className="p-12 text-center border-dashed">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                There are no events available for registration right now. Check back later or explore all events to see what's coming up!
              </p>
              <Button variant="outline" asChild>
                <Link to="/student/events">
                  <Calendar className="w-4 h-4 mr-2" />
                  Browse All Events
                </Link>
              </Button>
            </Card>
          )}
        </section>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent && !showRegistration} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader className="relative pb-6 border-b border-border/50">
                <div className="grid grid-cols-1 gap-4">
                  {/* Event Title and Organizer Info */}
                  <div className="space-y-2">
                    <DialogTitle className="text-3xl font-bold text-foreground leading-tight">
                      {selectedEvent.name}
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
                      Organized by {selectedEvent.clubName}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8 mt-8">
                {/* Poster */}
                {selectedEvent.poster && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted shadow-lg">
                    <img
                      src={selectedEvent.poster}
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

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

                      {selectedEvent.time && (
                        <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                          <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                            <Clock className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-700/70 mb-1">Time</p>
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
                            <p className="text-sm font-medium text-red-700/70 mb-1">Venue</p>
                            <p className="text-foreground font-medium">{selectedEvent.venue}</p>
                            <p className="text-xs text-red-600/70 mt-1">Capacity: {(() => {
                              const venue = VENUES.find(v => v.name === selectedEvent.venue);
                              return venue ? venue.capacity : 'N/A';
                            })()} seats</p>
                          </div>
                        </div>
                      )}

                      <div className="group flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50/50 to-violet-50/50 rounded-xl border border-purple-100/50 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-700/70 mb-1">Participants</p>
                          <p className="text-foreground font-medium">{selectedEvent.participants.length} / {selectedEvent.expectedParticipants} registered</p>
                          <p className="text-xs text-purple-600/70 mt-1">
                            {selectedEvent.expectedParticipants - selectedEvent.participants.length > 0
                              ? `${selectedEvent.expectedParticipants - selectedEvent.participants.length} seats remaining`
                              : 'Event full'
                            }
                          </p>
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
                            <div className="p-3 bg-amber-100 rounded-lg">
                              <User className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-700/70 mb-1">Guest Speaker</p>
                              <p className="text-foreground font-semibold text-lg">{selectedEvent.guestName}</p>
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
                            <p className="text-foreground font-medium">{selectedEvent.organizerName || selectedEvent.clubName}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration Button */}
                {selectedEvent.status === 'venue_selected' &&
                 !selectedEvent.participants.some(p => p.studentId === user?.id) && (
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={() => setShowRegistration(true)}
                      >
                        Register Now
                      </Button>
                      <Button
                        variant="outline"
                        className="px-6 py-3 rounded-xl"
                        onClick={() => {/* Add to calendar functionality */}}
                        title="Add to Calendar"
                      >
                        📅
                      </Button>
                    </div>
                  </div>
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
              <Label htmlFor="reg-uid">University ID (UID) <span className="text-red-500">*</span></Label>
              <Input
                id="reg-uid"
                placeholder="Enter your UID"
                value={registrationData.uid}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, uid: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="Enter your email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-branch">Branch <span className="text-red-500">*</span></Label>
              <Input
                id="reg-branch"
                placeholder="Enter your branch"
                value={registrationData.branch}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, branch: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-sec">Section <span className="text-red-500">*</span></Label>
              <Input
                id="reg-sec"
                placeholder="Enter your section"
                value={registrationData.sec}
                onChange={(e) => setRegistrationData(prev => ({ ...prev, sec: e.target.value }))}
                required
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