import React from 'react';
import { Event } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onViewDetails?: () => void;
  onRegister?: () => void;
  showActions?: boolean;
  variant?: 'student' | 'club' | 'department';
  isRegistered?: boolean;
}

const statusColors: Record<string, string> = {
  pending_approval: 'bg-warning text-warning-foreground',
  approved: 'bg-success text-success-foreground',
  rejected: 'bg-destructive text-destructive-foreground',
  venue_selected: 'bg-primary text-primary-foreground',
  completed: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  venue_selected: 'Upcoming',
  completed: 'Completed',
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onRegister,
  showActions = true,
  variant = 'student',
  isRegistered = false,
}) => {
  return (
    <Card className="portal-card overflow-hidden hover:shadow-lg transition-all duration-300">
      {event.poster && (
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={event.poster}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2">{event.name}</h3>
          <Badge className={statusColors[event.status]}>
            {statusLabels[event.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{event.clubName}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(new Date(event.date), 'MMM d, yyyy')}
          </div>
          {event.time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.venue}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {event.participants.length} / {event.expectedParticipants}
          </div>
        </div>
      </CardContent>
      {showActions && (
        <CardFooter className="gap-2">
          <Button variant="outline" className="flex-1" onClick={onViewDetails}>
            View Details
          </Button>
          {variant === 'student' && event.status === 'venue_selected' && !isRegistered && (
            <Button className="flex-1" onClick={onRegister}>
              Register
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default EventCard;