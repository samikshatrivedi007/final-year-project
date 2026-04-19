import { Router } from 'express';
import { getBranches } from '../controllers/branch.controller';
import { login, register, getMe, changePassword, updateProfile, deleteAccount } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Public: used by signup page to load branches based on selected course
router.get('/branches', getBranches);
router.get('/me', authenticate, getMe);
router.patch('/change-password', authenticate, changePassword);
router.patch('/update-profile', authenticate, updateProfile);
router.delete('/delete-account', authenticate, deleteAccount);

export default router;
