import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
    name: string;
    code: string;
}

const departmentSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        code: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
