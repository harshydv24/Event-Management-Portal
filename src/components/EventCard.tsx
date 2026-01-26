import React from 'react';
import { Event } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onViewDetails?: () => void;
  onRegister?: () => void;
  showActions?: boolean;
  variant?: 'student' | 'club' | 'department';
  isRegistered?: boolean;
}

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
            <h3 className="text-lg font-semibold">{event.name}</h3>
            {isRegistered && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                ✓ Registered
              </Badge>
            )}
            {event.status === 'completed' && (
              <Badge className="bg-gray-100 text-gray-800">
                Completed
              </Badge>
            )}
            {event.status === 'venue_selected' && !isRegistered && (
              <Badge className="bg-blue-100 text-blue-800">
                Upcoming
              </Badge>
            )}
            {event.status === 'pending_approval' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                Pending Approval
              </Badge>
            )}
            {event.status === 'approved' && (
              <Badge className="bg-green-100 text-green-800">
                Approved
              </Badge>
            )}
            {event.status === 'rejected' && (
              <Badge className="bg-red-100 text-red-800">
                Rejected
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
            <span className="font-medium text-foreground">{event.organizerName || event.clubName}</span>
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
                className="shadow-sm"
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