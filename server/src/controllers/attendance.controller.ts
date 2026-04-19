import { Response } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { AttendanceSummary } from '../models/AttendanceSummary';
import { Student } from '../models/Student';

export const getStudentAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        let studentId = id;
        if (id === 'me' && req.user) {
            const student = await Student.findOne({ userId: req.user.id });
            if (!student) {
                res.status(404).json({ error: 'Student not found' });
                return;
            }
            studentId = student._id.toString();
        }

        const attendance = await AttendanceSummary.find({ studentId }).populate('subjectId', 'name code');
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch attendance summary', details: (error as Error).message });
    }
};
