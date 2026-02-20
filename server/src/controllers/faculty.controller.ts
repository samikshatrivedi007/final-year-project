import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Faculty } from '../models/Faculty';
import { Timetable } from '../models/Timetable';
import { Assignment } from '../models/Assignment';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';

export const getFacultyDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user?.id }).populate('courses');
        if (!faculty) { res.status(404).json({ error: 'Faculty profile not found' }); return; }

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const schedule = await Timetable.find({ facultyId: faculty._id })
            .where('dayOfWeek').equals(today)
            .populate('courseId', 'name code')
            .sort('startTime');

        const assignments = await Assignment.find({ facultyId: faculty._id })
            .populate('courseId', 'name')
            .sort('-createdAt');

        const totalSubmissions = assignments.reduce((acc, a) => acc + a.submissions.length, 0);
        const happeningNow = schedule.find(s => s.isLive) || null;

        res.json({ faculty, schedule, assignments, totalSubmissions, happeningNow });
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
        const { courseId, records } = req.body; // records: [{studentId, status}]
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const ops = records.map((r: { studentId: string; status: string }) =>
            Attendance.findOneAndUpdate(
                { courseId, studentId: r.studentId, date },
                { status: r.status },
                { upsert: true, new: true }
            )
        );
        await Promise.all(ops);
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark attendance' });
    }
};

export const toggleLiveClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const timetable = await Timetable.findById(id);
        if (!timetable) { res.status(404).json({ error: 'Class not found' }); return; }
        timetable.isLive = !timetable.isLive;
        await timetable.save();
        res.json({ isLive: timetable.isLive });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle live class' });
    }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id)
            .populate('submissions.studentId', 'name rollNo');
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
        res.json(assignment.submissions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { studentId, grade, feedback } = req.body;
        const assignment = await Assignment.findById(id);
        if (!assignment) { res.status(404).json({ error: 'Assignment not found' }); return; }
        const sub = assignment.submissions.find(s => s.studentId.toString() === studentId);
        if (!sub) { res.status(404).json({ error: 'Submission not found' }); return; }
        sub.grade = grade;
        sub.feedback = feedback;
        await assignment.save();
        res.json({ message: 'Graded successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to grade submission' });
    }
};
