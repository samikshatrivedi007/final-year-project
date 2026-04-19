import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getStudentAttendanceSummary } from '../controllers/attendance.controller';

const router = Router();

router.use(authenticate, authorize('student'));
router.get('/student/:id', getStudentAttendanceSummary);

export default router;
