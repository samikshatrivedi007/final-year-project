import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    courseId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    date: Date;
    status: 'present' | 'absent' | 'late';
}

const attendanceSchema = new Schema<IAttendance>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    },
    { timestamps: true }
);

// Unique constraint: one attendance record per student per course per day
attendanceSchema.index({ courseId: 1, studentId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
