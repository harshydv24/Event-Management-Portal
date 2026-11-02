import mongoose, { Schema } from 'mongoose';

export type UserRole = 'student' | 'club' | 'department';

export interface IUser {
  _id: string;          // Firebase Auth UID
  email: string;
  name: string;
  role: UserRole;
  uid?: string;         // University ID for students
  clubId?: string;      // For club users
  createdAt: Date;
  updatedAt: Date;
}


const userSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },   // Use Firebase UID as _id
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['student', 'club', 'department'] },
    uid: { type: String, trim: true },       // University ID for students
    clubId: { type: String },                // For club users
  },
  {
    timestamps: true,   // Automatically manages createdAt and updatedAt
    _id: false,         // We manage _id ourselves (Firebase UID)
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ clubId: 1 });

const User = mongoose.model<IUser>('User', userSchema);
export default User;
