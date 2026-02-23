import mongoose, { Document, Schema } from 'mongoose';

export interface IMarksEntry {
    assignmentId: mongoose.Types.ObjectId;
    assignmentTitle: string;
    marks: number;
    reviewedAt: Date;
}

export interface IMarks extends Document {
    studentId: mongoose.Types.ObjectId;
    rollNo: string;
    course: string;   // Degree (BTech | MTech | BPharma)
    branch: string;
    totalMarks: number;
    reviewedCount: number;
    averageMarks: number;
    entries: IMarksEntry[];
}

const marksEntrySchema = new Schema<IMarksEntry>({
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    assignmentTitle: { type: String, required: true },
    marks: { type: Number, required: true },
    reviewedAt: { type: Date, default: Date.now },
});

const marksSchema = new Schema<IMarks>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
        rollNo: { type: String, required: true },
        course: { type: String, required: true },
        branch: { type: String, required: true },
        totalMarks: { type: Number, default: 0 },
        reviewedCount: { type: Number, default: 0 },
        averageMarks: { type: Number, default: 0 },
        entries: [marksEntrySchema],
    },
    { timestamps: true }
);

// Index for fast lookups by Roll Number
marksSchema.index({ rollNo: 1 });

export const Marks = mongoose.model<IMarks>('Marks', marksSchema);
