import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
    name: string;
    code: string;
    facultyId: mongoose.Types.ObjectId;
    branch: string;
    semester: number;
}

const courseSchema = new Schema<ICourse>(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
        branch: { type: String, required: true },
        semester: { type: Number, required: true },
    },
    { timestamps: true }
);

export const Course = mongoose.model<ICourse>('Course', courseSchema);
