import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    courseId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    timetableId?: mongoose.Types.ObjectId;
    course: string;   // Degree (denormalized for fast aggregation)
    branch: string;   // Branch (denormalized)
    date: Date;
    status: 'present' | 'absent' | 'late';
}

const attendanceSchema = new Schema<IAttendance>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        timetableId: { type: Schema.Types.ObjectId, ref: 'Timetable' },
        course: { type: String, required: true },
        branch: { type: String, required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    },
    { timestamps: true }
);

// Unique per student+course+date to prevent duplicate entries
attendanceSchema.index({ courseId: 1, studentId: 1, date: 1 }, { unique: true });
// Fast aggregation by course+branch
attendanceSchema.index({ course: 1, branch: 1, date: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
