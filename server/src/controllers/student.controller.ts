import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Student } from '../models/Student';
import { Timetable } from '../models/Timetable';
import { Assignment } from '../models/Assignment';
import { Attendance } from '../models/Attendance';
import { Marks } from '../models/Marks';
import { isClassActive } from '../utils/time';

/** Returns total minutes since midnight from a "HH:MM" (or "HH:MM AM/PM") string */
const timeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.trim().split(/\s+/);
    let [hours, minutes] = time.split(':').map(Number);
    if (period) {
        if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
};

/** True if the class has ended (endTime + 1 min grace) on today's schedule */
const isClassExpiredServer = (dayOfWeek: string, endTimeStr: string): boolean => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (days[now.getDay()] !== dayOfWeek) return false;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return currentMinutes > timeToMinutes(endTimeStr) + 1;
};

/** True if assignment due date + 1 min grace has passed */
const isAssignmentExpiredServer = (dueDate: Date | string): boolean => {
    return Date.now() > new Date(dueDate).getTime() + 60 * 1000;
};

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // FIX: populate branch so we get the name string, not a raw ObjectId
        const student = await Student.findOne({ userId: req.user?.id }).populate('branch', 'name');
        if (!student) { res.status(404).json({ error: 'Student profile not found' }); return; }

        // FIX: resolve branch to its name string before using in queries
        const branchName: string = typeof student.branch === 'object' && student.branch !== null
            ? (student.branch as any).name
            : String(student.branch);

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        // FIX: use branchName (string) not student.branch (ObjectId)
        const timetable = await Timetable.find({ course: student.course, branch: branchName, dayOfWeek: today })
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

        // Filter out classes whose end time + 1 min grace has passed
        const activeTimetable = timetable.filter(t => !isClassExpiredServer(t.dayOfWeek, t.endTime));

        // FIX: use branchName (string) not student.branch (ObjectId)
        const allBranchAssignments = await Assignment.find({ course: student.course, branch: branchName })
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

        const happeningNow = activeTimetable.find(t => t.isLive) || null;

        res.json({
            // FIX: send branchName string to frontend, not raw ObjectId
            student: { name: student.name, rollNo: student.rollNo, course: student.course, branch: branchName, semester: student.semester },
            timetable: activeTimetable,
            pendingAssignments: pendingAssignments.filter(a => !isAssignmentExpiredServer(a.dueDate)),
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
        // FIX: populate branch
        const student = await Student.findOne({ userId: req.user?.id }).populate('branch', 'name');
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

        // FIX: resolve to string
        const branchName: string = typeof student.branch === 'object' && student.branch !== null
            ? (student.branch as any).name
            : String(student.branch);

        // FIX: query with branchName
        const timetable = await Timetable.find({ course: student.course, branch: branchName })
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
        // FIX: populate branch
        const student = await Student.findOne({ userId: req.user?.id }).populate('branch', 'name');
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

        // FIX: resolve to string
        const branchName: string = typeof student.branch === 'object' && student.branch !== null
            ? (student.branch as any).name
            : String(student.branch);

        // FIX: query with branchName
        const assignments = await Assignment.find({ course: student.course, branch: branchName })
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
        res.json(enriched.filter(a => !isAssignmentExpiredServer(a.dueDate)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};

export const submitAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { fileUrl } = req.body;
        if (!fileUrl) { res.status(400).json({ error: 'fileUrl is required' }); return; }

        // FIX: populate branch so the comparison works
        const student = await Student.findOne({ userId: req.user?.id }).populate('branch', 'name');
        if (!student) { res.status(404).json({ error: 'Student not found' }); return; }

        // FIX: resolve to string before comparing
        const branchName: string = typeof student.branch === 'object' && student.branch !== null
            ? (student.branch as any).name
            : String(student.branch);

        const assignment = await Assignment.findById(id);
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

        // FIX: compare against branchName string, not ObjectId
        if (assignment.course !== student.course || assignment.branch !== branchName) {
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
