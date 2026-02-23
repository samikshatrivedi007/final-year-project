import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Branch } from '../models/BranchModel';
import { emitTo } from '../socket';

// Public — used by signup page to load branches dynamically
export const getBranches = async (req: Request, res: Response): Promise<void> => {
    try {
        const { course } = req.query;
        const filter = course ? { course } : {};
        const branches = await Branch.find(filter).sort('name');
        res.json(branches);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
};

// Admin only — create branch
export const createBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, course, description } = req.body;
        if (!name || !course) {
            res.status(400).json({ error: 'Branch name and course are required' });
            return;
        }
        const existing = await Branch.findOne({ name: name.trim(), course });
        if (existing) {
            res.status(409).json({ error: `Branch "${name}" already exists under ${course}` });
            return;
        }
        const branch = await Branch.create({ name: name.trim(), course, description: description || '' });
        emitTo('admin', 'branch:created', { branch });
        res.status(201).json(branch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create branch', details: (error as Error).message });
    }
};

// Admin only — update branch
export const updateBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const branch = await Branch.findByIdAndUpdate(id, { name, description }, { new: true });
        if (!branch) { res.status(404).json({ error: 'Branch not found' }); return; }
        res.json(branch);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update branch' });
    }
};

// Admin only — delete branch
export const deleteBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const branch = await Branch.findByIdAndDelete(id);
        if (!branch) { res.status(404).json({ error: 'Branch not found' }); return; }
        res.json({ message: `Branch "${branch.name}" deleted` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete branch' });
    }
};
