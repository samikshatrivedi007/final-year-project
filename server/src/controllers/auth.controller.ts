import { Request, Response } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { generateToken } from '../utils/generateToken';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role, rollOrId, phone } = req.body;
        if (!username || !password || !role || !rollOrId || !phone) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        const exists = await User.findOne({ rollOrId });
        if (exists) {
            res.status(409).json({ error: 'User with this Roll/ID already exists' });
            return;
        }
        const user = await User.create({ username, passwordHash: password, role, rollOrId, phone });
        // Create role-specific profile
        if (role === 'student') {
            await Student.create({ userId: user._id, name: username, rollNo: rollOrId, semester: 1, branch: 'General', courses: [] });
        } else if (role === 'faculty') {
            await Faculty.create({ userId: user._id, name: username, employeeId: rollOrId, department: 'General', courses: [] });
        }
        const token = generateToken({ id: user._id.toString(), role: user.role, username: user.username });
        res.status(201).json({ token, role: user.role, username: user.username, rollOrId: user.rollOrId });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: (error as Error).message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, rollOrId, password } = req.body;
        if (!rollOrId || !password) {
            res.status(400).json({ error: 'Roll/ID and password are required' });
            return;
        }
        const user = await User.findOne({ rollOrId });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        if (username && user.username !== username) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = generateToken({ id: user._id.toString(), role: user.role, username: user.username });
        res.json({ token, role: user.role, username: user.username, rollOrId: user.rollOrId });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: (error as Error).message });
    }
};

export const getMe = async (req: Request & { user?: { id: string; role: string; username: string } }, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?.id).select('-passwordHash');
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
