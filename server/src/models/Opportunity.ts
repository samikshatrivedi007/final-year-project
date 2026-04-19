import mongoose, { Document, Schema } from 'mongoose';

export interface IOpportunity extends Document {
    company: string;
    title: string;
    type: 'Internship' | 'Job' | 'Training';
    deadline: Date;
    eligibility: string;
    description: string;
}

const opportunitySchema = new Schema<IOpportunity>(
    {
        company: { type: String, required: true },
        title: { type: String, required: true },
        type: { type: String, enum: ['Internship', 'Job', 'Training'], required: true },
        deadline: { type: Date, required: true },
        eligibility: { type: String, required: true },
        description: { type: String, required: true },
    },
    { timestamps: true }
);

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', opportunitySchema);
