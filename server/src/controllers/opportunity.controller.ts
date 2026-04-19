import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Opportunity } from '../models/Opportunity';
import { Application } from '../models/Application';
import { Student } from '../models/Student';

export const getOpportunities = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const opportunities = await Opportunity.find().sort({ deadline: 1 });
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
};

export const applyOpportunity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { opportunityId } = req.body;
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

        const existing = await Application.findOne({ studentId: student._id, opportunityId });
        if (existing) {
            res.status(400).json({ error: 'Already applied for this opportunity' });
            return;
        }

        const application = new Application({
            studentId: student._id,
            opportunityId
        });
        await application.save();

        res.json({ message: 'Applied successfully', application });
    } catch (error) {
        res.status(500).json({ error: 'Failed to apply' });
    }
};

export const getStudentApplications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        let studentId = id;
        if (id === 'me' && req.user) {
            const student = await Student.findOne({ userId: req.user.id });
            if (!student) {
                res.status(404).json({ error: 'Student not found' });
                return;
            }
            studentId = student._id.toString();
        }

        const applications = await Application.find({ studentId }).populate('opportunityId');
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};

export const createOpportunity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const opportunity = new Opportunity(req.body);
        await opportunity.save();
        res.status(201).json(opportunity);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
};

export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const applications = await Application.find()
            .populate('studentId', 'name rollNo course branch')
            .populate('opportunityId', 'company title type');
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all applications' });
    }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const application = await Application.findByIdAndUpdate(id, { status }, { new: true });
        if (!application) {
            res.status(404).json({ error: 'Application not found' });
            return;
        }
        res.json(application);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update application status' });
    }
};
