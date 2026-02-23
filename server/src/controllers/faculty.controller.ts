import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Faculty } from '../models/Faculty';
import { Timetable } from '../models/Timetable';
import { Assignment } from '../models/Assignment';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';
import { Marks } from '../models/Marks';
import { emitTo } from '../socket';

export const getFacultyDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user?.id });
        if (!faculty) { res.status(404).json({ error: 'Faculty profile not found' }); return; }

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = await Timetable.find({ facultyId: faculty._id, dayOfWeek: today })
            .populate('courseId', 'name code branch')
            .sort('startTime');

        // Auto-teardown expired live classes
        for (const s of schedule) {
            if (s.isLive && !isClassActive(s.dayOfWeek, s.startTime, s.endTime)) {
                s.isLive = false;
                await Timetable.updateOne({ _id: s._id }, { isLive: false });
            }
        }

        const assignments = await Assignment.find({ facultyId: faculty._id })
            .populate('courseId', 'name')
            .sort('-createdAt');

        const pendingReviews = assignments.reduce((acc, a) =>
            acc + a.submissions.filter(s => !s.isReviewed).length, 0);
        const totalSubmissions = assignments.reduce((acc, a) => acc + a.submissions.length, 0);
        const happeningNow = schedule.find(s => s.isLive) || null;

        const allAttendance = await Attendance.find({ courseId: { $in: schedule.map(s => s.courseId) } });
        const presentCount = allAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = allAttendance.length > 0
            ? Math.round((presentCount / allAttendance.length) * 100) : 0;

        res.json({ faculty, schedule, assignments, totalSubmissions, pendingReviews, attendanceRate, happeningNow });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch faculty dashboard' });
    }
};

export const getFacultySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user?.id });
        if (!faculty) { res.status(404).json({ error: 'Faculty not found' }); return; }
        const schedule = await Timetable.find({ facultyId: faculty._id })
            .populate('courseId', 'name code')
            .sort('dayOfWeek startTime');
        res.json(schedule);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, timetableId, records } = req.body;
        const date = new Date();
        date.setHours(0, 0, 0, 0);

        const timetable = await Timetable.findById(timetableId);
        const course = timetable?.course || '';
        const branch = timetable?.branch || '';

        const ops = records.map((r: { studentId: string; status: string }) =>
            Attendance.findOneAndUpdate(
                { courseId, studentId: r.studentId, date },
                { status: r.status, timetableId, course, branch },
                { upsert: true, new: true }
            )
        );
        await Promise.all(ops);

        if (branch) {
            emitTo([`branch:${course}:${branch}`, 'admin'], 'attendance:updated', { courseId, date, course, branch });
        }

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

import { isClassActive } from '../utils/time';

export const toggleLiveClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const timetable = await Timetable.findById(id);
        if (!timetable) { res.status(404).json({ error: 'Class not found' }); return; }

        if (!timetable.isLive) {
            // Attempting to start the class. Check if it's currently the correct time.
            const active = isClassActive(timetable.dayOfWeek, timetable.startTime, timetable.endTime);
            if (!active) {
                res.status(400).json({ error: 'Cannot start a live class outside its scheduled time window.' });
                return;
            }
        }

        timetable.isLive = !timetable.isLive;
        await timetable.save();

        const room = `branch:${timetable.course}:${timetable.branch}`;
        emitTo(room, 'class:live', {
            timetableId: id,
            courseId: timetable.courseId,
            isLive: timetable.isLive,
            course: timetable.course,
            branch: timetable.branch,
        });

        res.json({ isLive: timetable.isLive });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle live class', details: (error as Error).message });
    }
};

export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user?.id });
        if (!faculty) { res.status(404).json({ error: 'Faculty not found' }); return; }
        const { courseId, course, branch, title, description, dueDate } = req.body;
        if (!courseId || !course || !branch || !title || !dueDate) {
            res.status(400).json({ error: 'courseId, course, branch, title, and dueDate are required' });
            return;
        }
        const assignment = await Assignment.create({
            courseId, facultyId: faculty._id, course, branch, title,
            description: description || '', dueDate: new Date(dueDate), submissions: [],
        });
        const populated = await Assignment.findById(assignment._id).populate('courseId', 'name');

        emitTo([`branch:${course}:${branch}`, 'admin'], 'assignment:created', {
            assignmentId: assignment._id, title, course, branch, dueDate,
        });

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create assignment', details: (error as Error).message });
    }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id).populate('courseId', 'name');
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

        const enriched = await Promise.all(
            assignment.submissions.map(async (sub) => {
                const student = await Student.findById(sub.studentId).select('name rollNo course branch');
                return {
                    _id: sub._id,
                    studentId: sub.studentId,
                    studentName: student?.name || 'Unknown',
                    rollNo: student?.rollNo || '',
                    course: student?.course || '',
                    branch: student?.branch || '',
                    submittedAt: sub.submittedAt,
                    fileUrl: sub.fileUrl || '',
                    grade: sub.grade,
                    feedback: sub.feedback || '',
                    isReviewed: sub.isReviewed,
                };
            })
        );
        res.json({
            assignment: { title: assignment.title, course: assignment.course, branch: assignment.branch, dueDate: assignment.dueDate },
            submissions: enriched
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { studentId, grade, feedback } = req.body;
        if (grade === undefined || grade === null) { res.status(400).json({ error: 'Grade is required' }); return; }
        const assignment = await Assignment.findById(id);
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }

        const sub = assignment.submissions.find(s => s.studentId.toString() === studentId);
        if (!sub) { res.status(404).json({ error: 'Submission not found' }); return; }
        sub.grade = grade;
        sub.feedback = feedback || '';
        sub.isReviewed = true;
        await assignment.save();

        // Update Marks model
        const student = await Student.findById(studentId);
        if (student) {
            let marks = await Marks.findOne({ studentId: student._id });
            if (!marks) {
                marks = await Marks.create({
                    studentId: student._id, rollNo: student.rollNo,
                    course: student.course, branch: student.branch,
                    totalMarks: 0, reviewedCount: 0, averageMarks: 0, entries: [],
                });
            }
            const existingEntry = marks.entries.find(e => e.assignmentId.toString() === id);
            if (existingEntry) {
                marks.totalMarks = marks.totalMarks - existingEntry.marks + grade;
                existingEntry.marks = grade;
                existingEntry.reviewedAt = new Date();
            } else {
                marks.entries.push({
                    assignmentId: assignment._id as unknown as import('mongoose').Types.ObjectId,
                    assignmentTitle: assignment.title, marks: grade, reviewedAt: new Date(),
                });
                marks.totalMarks += grade;
                marks.reviewedCount += 1;
            }
            marks.averageMarks = marks.reviewedCount > 0
                ? Math.round((marks.totalMarks / marks.reviewedCount) * 10) / 10 : 0;
            await marks.save();

            emitTo([`branch:${student.course}:${student.branch}`, 'admin'], 'marks:updated', {
                studentId: student._id, rollNo: student.rollNo,
                course: student.course, branch: student.branch,
                totalMarks: marks.totalMarks, averageMarks: marks.averageMarks,
            });
        }
        res.json({ message: 'Graded and marks updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to grade submission', details: (error as Error).message });
    }
};

// Returns students matching course+branch (used for attendance marking)
export const getStudentsByCourseAndBranch = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { course, branch } = req.query;
        if (!course || !branch) { res.status(400).json({ error: 'course and branch are required' }); return; }
        const students = await Student.find({ course, branch }).select('name rollNo course branch _id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
};

export const getFacultyAssignments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user?.id });
        if (!faculty) { res.status(404).json({ error: 'Faculty not found' }); return; }
        const assignments = await Assignment.find({ facultyId: faculty._id })
            .populate('courseId', 'name code')
            .sort('-createdAt');
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
};
