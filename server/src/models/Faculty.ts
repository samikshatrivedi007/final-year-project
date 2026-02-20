import mongoose, { Document, Schema } from 'mongoose';

export interface IFaculty extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    employeeId: string;
    department: string;
    courses: mongoose.Types.ObjectId[];
}

const facultySchema = new Schema<IFaculty>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        name: { type: String, required: true },
        employeeId: { type: String, required: true, unique: true },
        department: { type: String, required: true },
        courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    },
    { timestamps: true }
);

export const Faculty = mongoose.model<IFaculty>('Faculty', facultySchema);
