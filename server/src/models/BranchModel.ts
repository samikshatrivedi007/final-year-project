import mongoose, { Document, Schema } from 'mongoose';

export type CourseDegree = 'BTech' | 'MTech' | 'BPharma';
export const COURSES: CourseDegree[] = ['BTech', 'MTech', 'BPharma'];

export interface IBranch extends Document {
    name: string;
    course: CourseDegree;
    description?: string;
}

const branchSchema = new Schema<IBranch>(
    {
        name: { type: String, required: true, trim: true },
        course: { type: String, enum: ['BTech', 'MTech', 'BPharma'], required: true },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

// Unique: same branch name cannot exist twice under the same course
branchSchema.index({ name: 1, course: 1 }, { unique: true });
// Fast filtering by course
branchSchema.index({ course: 1 });

export const Branch = mongoose.model<IBranch>('Branch', branchSchema);
