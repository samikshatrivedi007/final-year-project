import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
    getFacultyDashboard,
    getFacultySchedule,
    markAttendance,
    toggleLiveClass,
    getAssignmentSubmissions,
    gradeSubmission,
} from '../controllers/faculty.controller';

const router = Router();

router.use(authenticate, authorize('faculty'));

router.get('/dashboard', getFacultyDashboard);
router.get('/schedule', getFacultySchedule);
router.post('/attendance/mark', markAttendance);
router.patch('/timetable/:id/live', toggleLiveClass);
router.get('/assignments/:id/submissions', getAssignmentSubmissions);
router.patch('/assignments/:id/grade', gradeSubmission);

export default router;
