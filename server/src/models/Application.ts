import mongoose, { Document, Schema } from 'mongoose';

export interface IApplication extends Document {
    studentId: mongoose.Types.ObjectId;
    opportunityId: mongoose.Types.ObjectId;
    status: 'Applied' | 'Viewed' | 'Rejected' | 'Cleared';
    appliedAt: Date;
}

const applicationSchema = new Schema<IApplication>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
        status: { type: String, enum: ['Applied', 'Viewed', 'Rejected', 'Cleared'], default: 'Applied' },
        appliedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

applicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
