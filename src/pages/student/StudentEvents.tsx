import React from 'react';
import { useEvents } from '@/contexts/EventContext';
import DashboardLayout from '@/components/DashboardLayout';
import EventCard from '@/components/EventCard';
import { Card } from '@/components/ui/card';

const StudentEvents: React.FC = () => {
  const { events } = useEvents();
  
  const allEvents = events.filter(e => 
    e.status === 'venue_selected' || e.status === 'completed'
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-slate-800">All Events</h1>
        
        {allEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                variant="student"
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No events available at the moment.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentEvents;