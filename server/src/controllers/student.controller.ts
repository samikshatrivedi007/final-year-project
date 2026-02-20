import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Student } from '../models/Student';
import { Timetable } from '../models/Timetable';
import { Assignment } from '../models/Assignment';
import { Attendance } from '../models/Attendance';

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id }).populate('courses');
        if (!student) { res.status(404).json({ error: 'Student profile not found' }); return; }

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const timetable = await Timetable.find({ courseId: { $in: student.courses } })
            .where('dayOfWeek').equals(today)
            .populate('courseId', 'name code')
            .populate('facultyId', 'name')
            .sort('startTime');

        const pendingAssignments = await Assignment.find({
            courseId: { $in: student.courses },
            dueDate: { $gte: new Date() },
            'submissions.studentId': { $ne: student._id },
        }).populate('courseId', 'name');

        const allAttendance = await Attendance.find({ studentId: student._id });
        const presentCount = allAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = allAttendance.length > 0
            ? Math.round((presentCount / allAttendance.length) * 100)
            : 100;

        const happeningNow = timetable.find(t => t.isLive) || null;

        res.json({ student, timetable, pendingAssignments, attendanceRate, happeningNow });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student dashboard' });
    }
};

export const getStudentTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const timetable = await Timetable.find({ courseId: { $in: student.courses } })
            .populate('courseId', 'name code')
            .populate('facultyId', 'name')
            .sort('dayOfWeek startTime');
        res.json(timetable);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};

export const getStudentAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const assignments = await Assignment.find({ courseId: { $in: student.courses } })
            .populate('courseId', 'name')
            .sort('dueDate');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const assignment = await Assignment.findById(id);
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
        const alreadySubmitted = assignment.submissions.some(s => s.studentId.toString() === student._id.toString());
        if (alreadySubmitted) { res.status(409).json({ error: 'Already submitted' }); return; }
        assignment.submissions.push({ studentId: student._id as any, submittedAt: new Date() });
        await assignment.save();
        res.json({ message: 'Assignment submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const records = await Attendance.find({ studentId: student._id }).populate('courseId', 'name');
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};
