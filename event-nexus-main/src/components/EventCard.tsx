import React from 'react';
import { Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, Eye, Check } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onViewDetails?: () => void;
  onRegister?: () => void;
  showActions?: boolean;
  variant?: 'student' | 'club' | 'department';
  isRegistered?: boolean;
}

const statusStyles: Record<string, string> = {
  pending_approval: 'bg-muted text-muted-foreground border border-border',
  approved: 'bg-success/15 text-success border border-success/20',
  rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
  venue_selected: 'bg-primary/10 text-primary/80 border border-primary/15',
  completed: 'bg-muted text-muted-foreground border border-border',
};

const statusLabels: Record<string, string> = {
  venue_selected: 'Upcoming',
  completed: 'Completed',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
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
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
            {isRegistered && (
              <Badge className="bg-primary/15 text-primary border-primary/20">
                <Check className="w-3 h-3 mr-1" /> Registered
              </Badge>
            )}
            {!isRegistered && event.status && statusLabels[event.status] && (
              <Badge className={statusStyles[event.status] || 'bg-muted text-muted-foreground'}>
                {statusLabels[event.status]}
              </Badge>
            )}
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

      {showActions && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-emphasis text-foreground">{event.organizerName || event.clubName}</span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onViewDetails}
              title="View detailed event information"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            {variant === 'student' && event.status === 'venue_selected' && !isRegistered && (
              <Button
                onClick={onRegister}
              >
                Register
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EventCard;