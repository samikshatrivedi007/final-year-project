import mongoose, { Document, Schema } from 'mongoose';

export interface ITimetable extends Document {
    courseId: mongoose.Types.ObjectId;
    facultyId: mongoose.Types.ObjectId;
    course: string;   // Degree: BTech | MTech | BPharma
    branch: string;   // Admin-managed branch name
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    isLive: boolean;
    lectureNumber: number;
}

const timetableSchema = new Schema<ITimetable>(
    {
        courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
        facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
        course: { type: String, required: true, enum: ['BTech', 'MTech', 'BPharma'] },
        branch: { type: String, required: true },
        dayOfWeek: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        room: { type: String, required: true },
        isLive: { type: Boolean, default: false },
        lectureNumber: { type: Number, default: 1 },
    },
    { timestamps: true }
);

// Indexes for fast course+branch+day lookups
timetableSchema.index({ course: 1, branch: 1, dayOfWeek: 1 });
timetableSchema.index({ facultyId: 1, dayOfWeek: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
