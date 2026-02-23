import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Student } from '../models/Student';
import { Timetable } from '../models/Timetable';
import { Assignment } from '../models/Assignment';
import { Attendance } from '../models/Attendance';
import { Marks } from '../models/Marks';
import { isClassActive } from '../utils/time';

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student profile not found' }); return; }

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        // Filter timetable by BOTH course AND branch
        const timetable = await Timetable.find({ course: student.course, branch: student.branch, dayOfWeek: today })
            .populate('courseId', 'name code')
            .populate('facultyId', 'name')
            .sort('startTime');

        // Auto-teardown expired live classes
        for (const t of timetable) {
            if (t.isLive && !isClassActive(t.dayOfWeek, t.startTime, t.endTime)) {
                t.isLive = false;
                await Timetable.updateOne({ _id: t._id }, { isLive: false });
            }
        }

        // Filter assignments by BOTH course AND branch
        const allBranchAssignments = await Assignment.find({ course: student.course, branch: student.branch })
            .populate('courseId', 'name code')
            .sort('dueDate');

        const enrichAssignment = (a: typeof allBranchAssignments[0]) => {
            const sub = a.submissions.find(s => s.studentId.toString() === student._id.toString());
            return {
                _id: a._id,
                title: a.title,
                description: a.description,
                courseId: a.courseId,
                course: a.course,
                branch: a.branch,
                dueDate: a.dueDate,
                mySubmission: sub ? {
                    submittedAt: sub.submittedAt,
                    fileUrl: sub.fileUrl,
                    grade: sub.grade,
                    feedback: sub.feedback,
                    isReviewed: sub.isReviewed,
                } : null,
                canEdit: !sub || (!sub.isReviewed && new Date() < new Date(a.dueDate)),
            };
        };

        const pendingAssignments = allBranchAssignments
            .filter(a => {
                const sub = a.submissions.find(s => s.studentId.toString() === student._id.toString());
                return !sub || !sub.isReviewed;
            })
            .map(enrichAssignment);

        const completedAssignments = allBranchAssignments
            .filter(a => {
                const sub = a.submissions.find(s => s.studentId.toString() === student._id.toString());
                return sub && sub.isReviewed;
            })
            .map(enrichAssignment);

        // Attendance rate
        const allAttendance = await Attendance.find({ studentId: student._id });
        const presentCount = allAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = allAttendance.length > 0
            ? Math.round((presentCount / allAttendance.length) * 100) : 0;

        const happeningNow = timetable.find(t => t.isLive) || null;

        res.json({
            student: { name: student.name, rollNo: student.rollNo, course: student.course, branch: student.branch, semester: student.semester },
            timetable,
            pendingAssignments,
            completedAssignments,
            totalAssignments: allBranchAssignments.length,
            attendanceRate,
            happeningNow,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard', details: (error as Error).message });
    }
};

export const getStudentTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const timetable = await Timetable.find({ course: student.course, branch: student.branch })
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
        const assignments = await Assignment.find({ course: student.course, branch: student.branch })
            .populate('courseId', 'name code')
            .sort('dueDate');

        const enriched = assignments.map(a => {
            const sub = a.submissions.find(s => s.studentId.toString() === student._id.toString());
            return {
                _id: a._id,
                title: a.title,
                description: a.description,
                courseId: a.courseId,
                course: a.course,
                branch: a.branch,
                dueDate: a.dueDate,
                mySubmission: sub ? { submittedAt: sub.submittedAt, fileUrl: sub.fileUrl, grade: sub.grade, feedback: sub.feedback, isReviewed: sub.isReviewed } : null,
                canEdit: !sub || (!sub.isReviewed && new Date() < new Date(a.dueDate)),
            };
        });
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fileUrl } = req.body;
        if (!fileUrl) { res.status(400).json({ error: 'fileUrl is required' }); return; }

        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

        const assignment = await Assignment.findById(id);
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

        // Verify assignment belongs to student's course+branch
        if (assignment.course !== student.course || assignment.branch !== student.branch) {
            res.status(403).json({ error: 'This assignment does not belong to your course/branch' });
            return;
        }

        if (new Date() > new Date(assignment.dueDate)) {
            res.status(400).json({ error: 'Due date has passed' });
            return;
        }

        const existingSub = assignment.submissions.find(s => s.studentId.toString() === student._id.toString());
        if (existingSub) {
            if (existingSub.isReviewed) {
                res.status(400).json({ error: 'Submission has already been reviewed and cannot be edited' });
                return;
            }
            // Update existing
            existingSub.fileUrl = fileUrl;
            existingSub.submittedAt = new Date();
        } else {
            assignment.submissions.push({
                studentId: student._id as unknown as import('mongoose').Types.ObjectId,
                submittedAt: new Date(),
                fileUrl,
                isReviewed: false,
            });
        }
        await assignment.save();
        res.json({ message: 'Assignment submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit assignment', details: (error as Error).message });
    }
};

export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const records = await Attendance.find({ studentId: student._id })
            .populate('courseId', 'name')
            .sort('-date');
        const presentCount = records.filter(r => r.status === 'present').length;
        const rate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;
        res.json({ records, presentCount, totalClasses: records.length, attendanceRate: rate });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
};

export const getStudentMarks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ userId: req.user?.id });
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }
        const marks = await Marks.findOne({ studentId: student._id });
        res.json(marks || { totalMarks: 0, averageMarks: 0, reviewedCount: 0, entries: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch marks' });
    }
};
