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
    createAssignment,
    getStudentsByCourseAndBranch,
    getFacultyAssignments,
} from '../controllers/faculty.controller';
import { getCourses } from '../controllers/timetable.controller';

const router = Router();

router.use(authenticate, authorize('faculty'));

router.get('/dashboard', getFacultyDashboard);
router.get('/schedule', getFacultySchedule);
router.post('/attendance/mark', markAttendance);
router.patch('/timetable/:id/live', toggleLiveClass);
router.get('/assignments', getFacultyAssignments);
router.post('/assignments', createAssignment);
router.get('/assignments/:id/submissions', getAssignmentSubmissions);
router.patch('/assignments/:id/grade', gradeSubmission);
// Updated: accepts both course & branch query params
router.get('/students-by-branch', getStudentsByCourseAndBranch);
router.get('/courses', getCourses);

export default router;
