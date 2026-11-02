import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  clubId: string;
  clubName: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    clubId: { type: String, required: true },
    clubName: { type: String, required: true, trim: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true, trim: true },
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

// Indexes
announcementSchema.index({ clubId: 1 });
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export default Announcement;
