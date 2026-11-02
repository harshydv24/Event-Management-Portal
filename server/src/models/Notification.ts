import mongoose, { Schema, Document } from 'mongoose';
import type { UserRole } from './User.js';

export interface INotification extends Document {
  userId: string;
  role: UserRole;
  message: string;
  relatedEventId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'club', 'department'] },
    message: { type: String, required: true, trim: true },
    relatedEventId: { type: String },
    isRead: { type: Boolean, default: false },
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
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
