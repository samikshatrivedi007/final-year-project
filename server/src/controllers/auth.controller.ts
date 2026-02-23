import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { Marks } from '../models/Marks';
import { Branch } from '../models/BranchModel';

const COURSES = ['BTech', 'MTech', 'BPharma'];


export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role, rollOrId, phone, name, semester, course, branch, department } = req.body;

        // ── Required field validation ──────────────────────────────────────────
        if (!username || !password || !role || !rollOrId) {
            res.status(400).json({ error: 'username, password, role, and rollOrId are required' });
            return;
        }

        // ── Uniqueness checks (before creating user) ───────────────────────────
        const existingByUsername = await User.findOne({ username });
        if (existingByUsername) {
            res.status(409).json({ error: 'Username is already taken' });
            return;
        }
        const existingByRollOrId = await User.findOne({ rollOrId });
        if (existingByRollOrId) {
            res.status(409).json({ error: 'Roll Number / Employee ID is already registered' });
            return;
        }

        // ── Create base user ───────────────────────────────────────────────────
        const user = await User.create({ username, passwordHash: password, role, rollOrId, phone: phone || '' });

        // ── Role-specific profile ──────────────────────────────────────────────
        if (role === 'student') {
            if (!course) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: 'Course (degree) is required for student registration' });
                return;
            }
            if (!COURSES.includes(course)) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: `Invalid course. Must be one of: ${COURSES.join(', ')}` });
                return;
            }
            if (!branch) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: 'Branch is required for student registration' });
                return;
            }
            // Validate branch exists under the selected course
            const branchDoc = await Branch.findOne({ name: branch, course });
            if (!branchDoc) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: `Branch "${branch}" does not exist under ${course}. Please contact your admin.` });
                return;
            }
            if (!name) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: 'Name is required' });
                return;
            }

            const studentDoc = await Student.create({
                userId: user._id,
                name,
                rollNo: rollOrId,
                course,
                branch,
                semester: semester || 1,
                courses: [],
            });

            // Initialize marks record for the student
            await Marks.create({
                studentId: studentDoc._id,
                rollNo: rollOrId,
                course,
                branch,
                totalMarks: 0,
                reviewedCount: 0,
                averageMarks: 0,
                entries: [],
            });
        } else if (role === 'faculty') {
            if (!name) {
                await User.findByIdAndDelete(user._id);
                res.status(400).json({ error: 'Name is required' });
                return;
            }
            await Faculty.create({
                userId: user._id,
                name,
                employeeId: rollOrId,
                department: department || '',
                courses: [],
            });
        }
        // admin / superadmin: no additional profile needed

        res.status(201).json({ message: 'Registration successful', role, username, rollOrId });
    } catch (error) {
        // MongoDB duplicate key
        if ((error as { code?: number }).code === 11000) {
            res.status(409).json({ error: 'Roll Number or Username already exists' });
            return;
        }
        res.status(500).json({ error: 'Registration failed', details: (error as Error).message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            res.status(400).json({ error: 'Identifier and password are required' });
            return;
        }
        // Allow login by username OR rollOrId
        const user = await User.findOne({
            $or: [{ username: identifier }, { rollOrId: identifier }],
        });
        if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) { res.status(401).json({ error: 'Invalid credentials' }); return; }

        const token = jwt.sign(
            { id: String(user._id), role: user.role, username: user.username },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}` }
        );
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                rollOrId: user.rollOrId,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user?.id).select('-passwordHash');
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const changePassword = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user?.id);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) { res.status(401).json({ error: 'Current password is incorrect' }); return; }
        user.passwordHash = newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change password' });
    }
};

export const updateProfile = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;
        const user = await User.findByIdAndUpdate(req.user?.id, { phone }, { new: true }).select('-passwordHash');
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const deleteAccount = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
    try {
        const user = await User.findByIdAndDelete(req.user?.id);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        if (user.role === 'student') {
            const student = await Student.findOneAndDelete({ userId: user._id });
            if (student) await Marks.deleteOne({ studentId: student._id });
        } else if (user.role === 'faculty') {
            await Faculty.findOneAndDelete({ userId: user._id });
        }
        res.json({ message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

