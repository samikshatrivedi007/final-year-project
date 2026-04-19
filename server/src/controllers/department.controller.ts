import { Request, Response } from 'express';
import { Department } from '../models/Department';

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
        const departments = await Department.find();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
};

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, code } = req.body;
        const dept = await Department.create({ name, code });
        res.status(201).json(dept);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create department' });
    }
};
