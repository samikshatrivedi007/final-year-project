import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    rollNo: string;
    semester: number;
    branch: string;
    courses: mongoose.Types.ObjectId[];
}

const studentSchema = new Schema<IStudent>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        name: { type: String, required: true },
        rollNo: { type: String, required: true, unique: true },
        semester: { type: Number, required: true },
        branch: { type: String, required: true },
        courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    },
    { timestamps: true }
);

export const Student = mongoose.model<IStudent>('Student', studentSchema);
