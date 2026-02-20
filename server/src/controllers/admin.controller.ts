import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { Attendance } from '../models/Attendance';
import { Assignment } from '../models/Assignment';

export const getAdminDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalFaculty = await Faculty.countDocuments();
        const allAttendance = await Attendance.find();
        const presentCount = allAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = allAttendance.length > 0
            ? Math.round((presentCount / allAttendance.length) * 100)
            : 0;
        const recentStudents = await User.find({ role: 'student' }).sort('-createdAt').limit(5).select('username rollOrId createdAt');
        const recentFaculty = await User.find({ role: 'faculty' }).sort('-createdAt').limit(5).select('username rollOrId createdAt');
        const recentSubmissions = await Assignment.find().sort('-updatedAt').limit(5)
            .populate('courseId', 'name').select('title dueDate submissions');
        res.json({ totalStudents, totalFaculty, attendanceRate, recentStudents, recentFaculty, recentSubmissions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admin dashboard' });
    }
};

export const getStudents = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const students = await Student.find().populate('userId', 'username rollOrId phone').populate('courses', 'name');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, password, rollOrId, phone, name, semester, branch } = req.body;
        const user = await User.create({ username, passwordHash: password, role: 'student', rollOrId, phone });
        const student = await Student.create({ userId: user._id, name, rollNo: rollOrId, semester, branch, courses: [] });
        res.status(201).json({ user: { username, rollOrId }, student });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create student', details: (error as Error).message });
    }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await Student.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) { res.status(404).json({ error: 'Student not found' }); return; }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update student' });
    }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await Student.findByIdAndDelete(id);
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        await User.findByIdAndDelete(student.userId);
        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
};

export const getFacultyList = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.find().populate('userId', 'username rollOrId phone').populate('courses', 'name');
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faculty' });
    }
};

export const createFaculty = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { username, password, rollOrId, phone, name, department } = req.body;
        const user = await User.create({ username, passwordHash: password, role: 'faculty', rollOrId, phone });
        const faculty = await Faculty.create({ userId: user._id, name, employeeId: rollOrId, department, courses: [] });
        res.status(201).json({ user: { username, rollOrId }, faculty });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create faculty', details: (error as Error).message });
    }
};

export const updateFaculty = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await Faculty.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) { res.status(404).json({ error: 'Faculty not found' }); return; }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update faculty' });
    }
};

export const deleteFaculty = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findByIdAndDelete(id);
        if (!faculty) { res.status(404).json({ error: 'Faculty not found' }); return; }
        await User.findByIdAndDelete(faculty.userId);
        res.json({ message: 'Faculty deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete faculty' });
    }
};

export const getAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalFaculty = await Faculty.countDocuments();
        const attendance = await Attendance.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const assignments = await Assignment.aggregate([
            { $project: { submissionCount: { $size: '$submissions' } } },
            { $group: { _id: null, total: { $sum: '$submissionCount' } } }
        ]);
        res.json({ totalStudents, totalFaculty, attendance, totalSubmissions: assignments[0]?.total || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
