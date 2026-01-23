// import React, { useState } from 'react';
// import { useEvents } from '@/contexts/EventContext';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// import { Textarea } from '@/components/ui/textarea';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Calendar, MapPin, Users, Clock, Check, X, Eye } from 'lucide-react';
// import { format } from 'date-fns';
// import { Event } from '@/types';
// import { useToast } from '@/hooks/use-toast';

// const DepartmentDashboard: React.FC = () => {
//   const { events, approveEvent, rejectEvent } = useEvents();
//   const { toast } = useToast();
  
//   const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
//   const [showRejectDialog, setShowRejectDialog] = useState(false);
//   const [feedback, setFeedback] = useState('');

//   const pendingEvents = events.filter(e => e.status === 'pending_approval');
//   const approvedEvents = events.filter(e => e.status === 'approved' || e.status === 'venue_selected');

//   const handleApprove = (event: Event) => {
//     approveEvent(event.id);
//     toast({ title: 'Event Approved!', description: `${event.name} has been approved.` });
//   };

//   const handleReject = () => {
//     if (!selectedEvent) return;
//     rejectEvent(selectedEvent.id, feedback);
//     toast({ title: 'Event Rejected', description: 'Feedback sent to the club.' });
//     setShowRejectDialog(false);
//     setSelectedEvent(null);
//     setFeedback('');
//   };

//   const EventRow = ({ event, showActions = true }: { event: Event; showActions?: boolean }) => (
//     <Card className="p-4 hover:shadow-md transition-shadow">
//       <div className="flex items-center justify-between">
//         <div className="flex-1">
//           <div className="flex items-center gap-3 mb-2">
//             <h4 className="font-semibold text-lg">{event.name}</h4>
//             <Badge variant="outline">{event.clubName}</Badge>
//           </div>
//           <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
//           <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//             <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(event.date), 'MMM d, yyyy')}</span>
//             <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.expectedParticipants} expected</span>
//             <span className="flex items-center gap-1"><Users className="w-4 h-4" />{event.participants.length} registered</span>
//           </div>
//         </div>
//         <div className="flex gap-2">
//           <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}><Eye className="w-4 h-4" /></Button>
//           {showActions && event.status === 'pending_approval' && (
//             <>
//               <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprove(event)}><Check className="w-4 h-4" /></Button>
//               <Button size="sm" variant="destructive" onClick={() => { setSelectedEvent(event); setShowRejectDialog(true); }}><X className="w-4 h-4" /></Button>
//             </>
//           )}
//         </div>
//       </div>
//     </Card>
//   );

//   return (
//     <DashboardLayout>
//       <div className="space-y-6 animate-fade-in">
//         <div className="grid grid-cols-2 gap-4">
//           <Card className="stat-card"><p className="text-3xl font-bold text-warning">{pendingEvents.length}</p><p className="text-muted-foreground">Pending Approval</p></Card>
//           <Card className="stat-card"><p className="text-3xl font-bold text-success">{approvedEvents.length}</p><p className="text-muted-foreground">Approved Events</p></Card>
//         </div>

//         <Tabs defaultValue="pending">
//           <TabsList><TabsTrigger value="pending">Pending ({pendingEvents.length})</TabsTrigger><TabsTrigger value="approved">Approved ({approvedEvents.length})</TabsTrigger></TabsList>
//           <TabsContent value="pending" className="space-y-4 mt-4">
//             {pendingEvents.length > 0 ? pendingEvents.map(e => <EventRow key={e.id} event={e} />) : <Card className="p-8 text-center"><p className="text-muted-foreground">No pending events.</p></Card>}
//           </TabsContent>
//           <TabsContent value="approved" className="space-y-4 mt-4">
//             {approvedEvents.length > 0 ? approvedEvents.map(e => <EventRow key={e.id} event={e} showActions={false} />) : <Card className="p-8 text-center"><p className="text-muted-foreground">No approved events.</p></Card>}
//           </TabsContent>
//         </Tabs>
//       </div>

//       <Dialog open={!!selectedEvent && !showRejectDialog} onOpenChange={() => setSelectedEvent(null)}>
//         <DialogContent className="max-w-2xl">
//           {selectedEvent && (
//             <>
//               <DialogHeader><DialogTitle>{selectedEvent.name}</DialogTitle><DialogDescription>{selectedEvent.clubName}</DialogDescription></DialogHeader>
//               <div className="space-y-4">
//                 <p>{selectedEvent.description}</p>
//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <div><strong>Date:</strong> {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}</div>
//                   <div><strong>Expected:</strong> {selectedEvent.expectedParticipants}</div>
//                   {selectedEvent.guestName && <div className="col-span-2"><strong>Guest:</strong> {selectedEvent.guestName}</div>}
//                 </div>
//                 <div><h4 className="font-semibold">Participants ({selectedEvent.participants.length})</h4>
//                   {selectedEvent.participants.length > 0 ? <div className="max-h-40 overflow-y-auto space-y-1 mt-2">{selectedEvent.participants.map((p,i) => <div key={p.id} className="text-sm p-2 bg-muted rounded">{i+1}. {p.studentName} ({p.studentUid}) - {p.studentEmail}</div>)}</div> : <p className="text-sm text-muted-foreground">No registrations yet.</p>}
//                 </div>
//               </div>
//             </>
//           )}
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
//         <DialogContent>
//           <DialogHeader><DialogTitle>Reject Event</DialogTitle><DialogDescription>Provide feedback for {selectedEvent?.name}</DialogDescription></DialogHeader>
//           <Textarea placeholder="Enter feedback for the club..." value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} />
//           <Button variant="destructive" onClick={handleReject}>Reject with Feedback</Button>
//         </DialogContent>
//       </Dialog>
//     </DashboardLayout>
//   );
// };

// export default DepartmentDashboard;

import { CalendarCheck, Hourglass, CheckCircle2, XCircle } from "lucide-react";



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

const DepartmentDashboard: React.FC = () => {
  const { events, approveEvent, rejectEvent } = useEvents();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
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
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
</div>


        {/* Filters */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
          <TabsList className="bg-muted/40">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="text-muted-foreground">
                  {activeTab === "all" && "No events found."}
                  {activeTab === "pending" && "No pending events to review."}
                  {activeTab === "approved" && "No approved events."}
                  {activeTab === "rejected" && "No rejected events."}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Dialog */}
      <Dialog open={!!selectedEvent && !rejectOpen} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.name}</DialogTitle>
                <DialogDescription>{selectedEvent.clubName}</DialogDescription>
              </DialogHeader>
              <p>{selectedEvent.description}</p>
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
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) => (
  <Card className="p-6 flex items-center gap-4">
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
  const map: any = {
    pending_approval: "warning",
    approved: "success",
    venue_selected: "success",
    rejected: "destructive",
  };
  return <Badge variant={map[status] || "secondary"}>{status.replace("_", " ")}</Badge>;
  
};