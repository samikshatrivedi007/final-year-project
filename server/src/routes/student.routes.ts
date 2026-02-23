import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
    getStudentDashboard,
    getStudentTimetable,
    getStudentAssignments,
    submitAssignment,
    getStudentAttendance,
    getStudentMarks,
} from '../controllers/student.controller';

const router = Router();

router.use(authenticate, authorize('student'));

router.get('/dashboard', getStudentDashboard);
router.get('/timetable', getStudentTimetable);
router.get('/assignments', getStudentAssignments);
router.post('/assignments/:id/submit', submitAssignment);
router.get('/attendance', getStudentAttendance);
router.get('/marks', getStudentMarks);

export default router;
