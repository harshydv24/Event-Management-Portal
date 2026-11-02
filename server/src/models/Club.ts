import mongoose, { Schema, Document } from 'mongoose';

export interface IClubMember {
  id: string;
  name: string;
  designation: string;
  branch?: string;
  year?: string;
  photo?: string;
  isPresident?: boolean;
  isFacultyAdvisor?: boolean;
}

export interface IClub {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  facultyAdvisor: IClubMember;
  president: IClubMember;
  coreTeam: IClubMember[];
  eventsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const clubMemberSchema = new Schema<IClubMember>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
    branch: { type: String, trim: true },
    year: { type: String, trim: true },
    photo: { type: String },
    isPresident: { type: Boolean, default: false },
    isFacultyAdvisor: { type: Boolean, default: false },
  },
  { _id: false }
);

const clubSchema = new Schema<IClub>(
  {
    _id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    logo: { type: String },
    facultyAdvisor: { type: clubMemberSchema, required: true },
    president: { type: clubMemberSchema, required: true },
    coreTeam: { type: [clubMemberSchema], default: [] },
    eventsCount: { type: Number, default: 0 },
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

const Club = mongoose.model<IClub>('Club', clubSchema);
export default Club;
