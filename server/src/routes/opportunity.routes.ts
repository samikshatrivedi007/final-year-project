import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { getOpportunities, applyOpportunity, getStudentApplications, createOpportunity, getAllApplications, updateApplicationStatus } from '../controllers/opportunity.controller';

const router = Router();

router.use(authenticate);

// Student routes
router.get('/opportunities', getOpportunities); // Also accessible by admin theoretically, let's keep it global authenticated
router.post('/apply', authorize('student'), applyOpportunity);
router.get('/applications/student/:id', authorize('student'), getStudentApplications);

// Admin routes
router.post('/opportunities', authorize('admin', 'superadmin'), createOpportunity);
router.get('/applications', authorize('admin', 'superadmin'), getAllApplications);
router.patch('/applications/:id', authorize('admin', 'superadmin'), updateApplicationStatus);

export default router;
