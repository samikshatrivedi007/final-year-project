import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { Attendance } from '../models/Attendance';
import { Assignment } from '../models/Assignment';
import { Marks } from '../models/Marks';
import { Branch } from '../models/BranchModel';
import { emitTo } from '../socket';

// ── Branch management (admin only) ───────────────────────────────────────────
export { getBranches, createBranch, updateBranch, deleteBranch } from './branch.controller';

// ── Student search by Roll Number OR Username ─────────────────────────────────
export const searchStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q } = req.query;
        if (!q) { res.status(400).json({ error: 'Search query is required' }); return; }

        // Find user by username or rollOrId
        const user = await User.findOne({
            role: 'student',
            $or: [
                { username: { $regex: q as string, $options: 'i' } },
                { rollOrId: { $regex: q as string, $options: 'i' } },
            ],
        });
        if (!user) { res.status(404).json({ error: 'No student found' }); return; }

        const student = await Student.findOne({ userId: user._id });
        if (!student) { res.status(404).json({ error: 'Student profile not found' }); return; }

        // Attendance stats
        const attendance = await Attendance.find({ studentId: student._id });
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const attendanceRate = attendance.length > 0
            ? Math.round((presentCount / attendance.length) * 100) : 0;

        // Marks
        const marks = await Marks.findOne({ studentId: student._id });

        // Assignment history
        const allAssignments = await Assignment.find({ course: student.course, branch: student.branch }).populate('courseId', 'name').sort('-createdAt');
        const assignmentHistory = allAssignments.map(a => {
            const sub = a.submissions.find(s => s.studentId.toString() === student._id.toString());
            return {
                title: a.title,
                courseId: a.courseId,
                dueDate: a.dueDate,
                submitted: !!sub,
                grade: sub?.grade,
                isReviewed: sub?.isReviewed || false,
            };
        });

        res.json({
            user: { username: user.username, rollOrId: user.rollOrId, phone: user.phone },
            student: { name: student.name, rollNo: student.rollNo, course: student.course, branch: student.branch, semester: student.semester },
            attendanceRate,
            totalClasses: attendance.length,
            marks: marks || { totalMarks: 0, averageMarks: 0, reviewedCount: 0 },
            assignmentHistory,
        });
    } catch (error) {
        res.status(500).json({ error: 'Search failed', details: (error as Error).message });
    }
};

// ── Admin Dashboard ───────────────────────────────────────────────────────────
export const getAdmins = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const admins = await User.find({ role: 'admin' }).select('username rollOrId phone createdAt').sort('-createdAt');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch admins' });
    }
};

export const deleteAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const admin = await User.findOneAndDelete({ _id: id, role: 'admin' });
        if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete admin' });
    }
};

export const updateStudentMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { totalMarks, averageMarks, entries } = req.body;
        const marks = await Marks.findOne({ studentId });
        if (!marks) { res.status(404).json({ error: 'Marks record not found' }); return; }
        if (totalMarks !== undefined) marks.totalMarks = totalMarks;
        if (averageMarks !== undefined) marks.averageMarks = averageMarks;
        if (entries !== undefined) {
            marks.entries = entries;
            marks.reviewedCount = entries.length;
            if (averageMarks === undefined && entries.length > 0) {
                const sum = entries.reduce((acc: number, e: { marks: number }) => acc + e.marks, 0);
                marks.averageMarks = Math.round((sum / entries.length) * 10) / 10;
            }
        }
        await marks.save();

        const student = await Student.findById(studentId);
        if (student) {
            emitTo([`branch:${student.course}:${student.branch}`, 'admin'], 'marks:updated', {
                studentId, rollNo: student.rollNo, course: student.course, branch: student.branch,
                totalMarks: marks.totalMarks, averageMarks: marks.averageMarks,
            });
        }

        res.json({ message: 'Marks updated successfully', marks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update marks', details: (error as Error).message });
    }
};

export const getStudentMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const marks = await Marks.findOne({ studentId });
        if (!marks) { res.status(404).json({ error: 'Marks record not found' }); return; }
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch marks', details: (error as Error).message });
    }
};

export const bulkUpdateMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { totalMarks, averageMarks } = req.body;
        if (totalMarks === undefined && averageMarks === undefined) {
            res.status(400).json({ error: 'Please provide totalMarks or averageMarks' });
            return;
        }

        const updates: any = {};
        if (totalMarks !== undefined) updates.totalMarks = totalMarks;
        if (averageMarks !== undefined) updates.averageMarks = averageMarks;

        await Marks.updateMany({}, { $set: updates });
        emitTo('admin', 'marks:bulk-updated', { totalMarks, averageMarks });

        res.json({ message: 'Marks updated for all students successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to bulk update marks', details: (error as Error).message });
    }
};

export const getAdminDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalFaculty = await Faculty.countDocuments();
        const totalBranches = await Branch.countDocuments();
        const allAttendance = await Attendance.find();
        const presentCount = allAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = allAttendance.length > 0
            ? Math.round((presentCount / allAttendance.length) * 100) : 0;
        const recentStudents = await User.find({ role: 'student' }).sort('-createdAt').limit(5).select('username rollOrId createdAt');
        const recentFaculty = await User.find({ role: 'faculty' }).sort('-createdAt').limit(5).select('username rollOrId createdAt');
        res.json({ totalStudents, totalFaculty, totalBranches, attendanceRate, recentStudents, recentFaculty });
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
        const { username, password, rollOrId, phone, name, semester, course, branch } = req.body;
        const user = await User.create({ username, passwordHash: password, role: 'student', rollOrId, phone });
        const student = await Student.create({ userId: user._id, name, rollNo: rollOrId, course, branch, semester: semester || 1, courses: [] });
        await Marks.create({ studentId: student._id, rollNo: rollOrId, course, branch });
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
        await Marks.deleteOne({ studentId: id });
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
        const attendance = await Attendance.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const assignments = await Assignment.aggregate([
            { $project: { submissionCount: { $size: '$submissions' } } },
            { $group: { _id: null, total: { $sum: '$submissionCount' } } }
        ]);
        res.json({ totalStudents, totalFaculty, attendance, totalSubmissions: assignments[0]?.total || 0 });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
