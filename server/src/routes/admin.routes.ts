import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
    getAdminDashboard,
    getStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getFacultyList,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getAnalytics,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin', 'superadmin'));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAnalytics);

// Students CRUD
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// Faculty CRUD
router.get('/faculty', getFacultyList);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

export default router;
