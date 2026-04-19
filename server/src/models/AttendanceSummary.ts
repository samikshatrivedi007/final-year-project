import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceSummary extends Document {
    studentId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;
    totalClasses: number;
    attendedClasses: number;
    medicalLeaves: number;
    events: number;
}

const attendanceSummarySchema = new Schema<IAttendanceSummary>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        subjectId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        totalClasses: { type: Number, default: 0 },
        attendedClasses: { type: Number, default: 0 },
        medicalLeaves: { type: Number, default: 0 },
        events: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const AttendanceSummary = mongoose.model<IAttendanceSummary>('AttendanceSummary', attendanceSummarySchema);
