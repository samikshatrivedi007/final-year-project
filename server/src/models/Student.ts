import mongoose, { Document, Schema } from 'mongoose';

export type CourseDegree = 'BTech' | 'MTech' | 'BPharma';
export const COURSES: CourseDegree[] = ['BTech', 'MTech', 'BPharma'];

export interface IStudent extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    rollNo: string;
    course: CourseDegree;
    branch: string;
    semester: number;
    courses: mongoose.Types.ObjectId[];
}

const studentSchema = new Schema<IStudent>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        name: { type: String, required: true },
        rollNo: { type: String, required: true, unique: true, trim: true },
        course: { type: String, enum: ['BTech', 'MTech', 'BPharma'], required: true },
        branch: { type: String, required: true, trim: true },
        semester: { type: Number, required: true, default: 1 },
        courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    },
    { timestamps: true }
);

// Fast lookups by course+branch
studentSchema.index({ course: 1, branch: 1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
