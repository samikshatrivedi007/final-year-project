import mongoose, { Document, Schema } from 'mongoose';

interface ISubmission {
    studentId: mongoose.Types.ObjectId;
    submittedAt: Date;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
}

export interface IAssignment extends Document {
    courseId: mongoose.Types.ObjectId;
    facultyId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    dueDate: Date;
    submissions: ISubmission[];
}

const submissionSchema = new Schema<ISubmission>({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    fileUrl: { type: String },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String },
});

const assignmentSchema = new Schema<IAssignment>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        dueDate: { type: Date, required: true },
        submissions: [submissionSchema],
    },
    { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
