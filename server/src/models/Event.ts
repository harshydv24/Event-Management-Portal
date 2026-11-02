import mongoose, { Schema, Document } from 'mongoose';

export type EventStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'venue_selected'
  | 'completed';

export interface IEventParticipant {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  studentUid: string;
  studentEmail: string;
  studentBranch: string;
  studentSec: string;
  registeredAt: string;
}

export interface IEvent extends Document {
  name: string;
  description: string;
  date: string;
  time?: string;
  venue?: string;
  expectedParticipants: number;
  guestName?: string;
  poster?: string;
  proposalPdf?: string;
  m2mPdf?: string;
  clubId: string;
  clubName: string;
  departmentName?: string;
  organizerName?: string;
  status: EventStatus;
  feedback?: string;
  participants: IEventParticipant[];
  createdAt: Date;
  updatedAt: Date;
}

const eventParticipantSchema = new Schema<IEventParticipant>(
  {
    id: { type: String, required: true },
    eventId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    studentUid: { type: String, required: true },
    studentEmail: { type: String, required: true, trim: true },
    studentBranch: { type: String, required: true, trim: true },
    studentSec: { type: String, required: true, trim: true },
    registeredAt: { type: String, required: true },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    time: { type: String },
    venue: { type: String },
    expectedParticipants: { type: Number, required: true, min: 1 },
    guestName: { type: String, trim: true },
    poster: { type: String },
    proposalPdf: { type: String },
    m2mPdf: { type: String },
    clubId: { type: String, required: true },
    clubName: { type: String, required: true, trim: true },
    departmentName: { type: String, trim: true },
    organizerName: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['pending_approval', 'approved', 'rejected', 'venue_selected', 'completed'],
      default: 'pending_approval',
    },
    feedback: { type: String },
    participants: { type: [eventParticipantSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id?.toString() || ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes for common queries
eventSchema.index({ clubId: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ createdAt: -1 });

const Event = mongoose.model<IEvent>('Event', eventSchema);
export default Event;
