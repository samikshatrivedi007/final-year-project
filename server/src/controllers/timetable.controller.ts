import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Timetable } from '../models/Timetable';
import { Course } from '../models/Course';
import { Faculty } from '../models/Faculty';

// --- Timetable CRUD ---

export const getTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { branch, course } = req.query;
        const filter: Record<string, string> = {};
        if (course && course !== 'all') filter.course = course as string;
        if (branch && branch !== 'all') filter.branch = branch as string;
        const entries = await Timetable.find(filter)
            .populate('courseId', 'name code branch')
            .populate('facultyId', 'name department')
            .sort('course branch dayOfWeek startTime');
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
};

export const createTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { courseId, facultyId, course, branch, dayOfWeek, startTime, endTime, room, lectureNumber } = req.body;
        if (!courseId || !facultyId || !course || !branch || !dayOfWeek || !startTime || !endTime || !room) {
            res.status(400).json({ error: 'courseId, facultyId, course, branch, dayOfWeek, startTime, endTime, and room are all required' });
            return;
        }
        const entry = await Timetable.create({
            courseId, facultyId, course, branch, dayOfWeek, startTime, endTime, room,
            lectureNumber: lectureNumber || 1,
            isLive: false,
        });
        const populated = await Timetable.findById(entry._id)
            .populate('courseId', 'name code')
            .populate('facultyId', 'name');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create timetable entry', details: (error as Error).message });
    }
};

export const updateTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await Timetable.findByIdAndUpdate(id, req.body, { new: true })
            .populate('courseId', 'name code')
            .populate('facultyId', 'name');
        if (!updated) { res.status(404).json({ error: 'Timetable entry not found' }); return; }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update timetable entry' });
    }
};

export const deleteTimetableEntry = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Timetable.findByIdAndDelete(id);
        if (!deleted) { res.status(404).json({ error: 'Timetable entry not found' }); return; }
        res.json({ message: 'Timetable entry deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete timetable entry' });
    }
};

// Teacher schedule derived from timetable (not a separate store)
export const getTeacherSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { facultyId } = req.query;
        const filter: Record<string, unknown> = {};
        if (facultyId) filter.facultyId = facultyId;
        const schedule = await Timetable.find(filter)
            .populate('courseId', 'name code branch')
            .populate('facultyId', 'name department')
            .sort('facultyId dayOfWeek startTime');
        // Group by faculty
        const grouped: Record<string, { faculty: { name: string; department: string }; entries: unknown[] }> = {};
        for (const entry of schedule) {
            const fac = entry.facultyId as unknown as { _id: string; name: string; department: string };
            const key = fac._id.toString();
            if (!grouped[key]) {
                grouped[key] = { faculty: { name: fac.name, department: fac.department }, entries: [] };
            }
            grouped[key].entries.push(entry);
        }
        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teacher schedule' });
    }
};

// --- Course CRUD ---

export const getCourses = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const courses = await Course.find().populate('facultyId', 'name').sort('branch name');
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, code, facultyId, branch, semester } = req.body;
        if (!name || !code || !facultyId || !branch || !semester) {
            res.status(400).json({ error: 'All course fields are required' });
            return;
        }
        const course = await Course.create({ name, code, facultyId, branch, semester });
        // Also add to faculty's courses array
        await Faculty.findByIdAndUpdate(facultyId, { $addToSet: { courses: course._id } });
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create course', details: (error as Error).message });
    }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updated = await Course.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) { res.status(404).json({ error: 'Course not found' }); return; }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update course' });
    }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndDelete(id);
        if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete course' });
    }
};
