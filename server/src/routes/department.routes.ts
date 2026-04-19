import { Router } from 'express';
import { getDepartments, createDepartment } from '../controllers/department.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// Publicly accessible for Signup Page
router.get('/', getDepartments);

// Admin / Superadmin only for creating new departments
router.post('/', authenticate, authorize('admin', 'superadmin'), createDepartment);

export default router;
