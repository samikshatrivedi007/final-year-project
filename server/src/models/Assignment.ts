import mongoose, { Document, Schema } from 'mongoose';

export interface ISubmission {
    _id?: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    submittedAt: Date;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
    isReviewed: boolean;
}

export interface IAssignment extends Document {
    courseId: mongoose.Types.ObjectId;
    facultyId: mongoose.Types.ObjectId;
    course: string;    // Degree: BTech | MTech | BPharma
    branch: string;    // Admin-managed branch name
    title: string;
    description: string;
    dueDate: Date;
    submissions: ISubmission[];
}

const submissionSchema = new Schema<ISubmission>({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    submittedAt: { type: Date, default: Date.now },
    fileUrl: { type: String, default: '' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: { type: String, default: '' },
    isReviewed: { type: Boolean, default: false },
});

const assignmentSchema = new Schema<IAssignment>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
        course: { type: String, required: true, enum: ['BTech', 'MTech', 'BPharma'] },
        branch: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        dueDate: { type: Date, required: true },
        submissions: [submissionSchema],
    },
    { timestamps: true }
);

// Indexes for fast course+branch-based queries
assignmentSchema.index({ course: 1, branch: 1, dueDate: 1 });
assignmentSchema.index({ facultyId: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
