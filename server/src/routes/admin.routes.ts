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
    getAdmins,
    deleteAdmin,
    updateStudentMarks,
    searchStudent,
    getStudentMarks,
    bulkUpdateMarks,
} from '../controllers/admin.controller';
import {
    getBranches,
    createBranch,
    updateBranch,
    deleteBranch,
} from '../controllers/branch.controller';
import {
    getTimetable,
    createTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    getTeacherSchedule,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
} from '../controllers/timetable.controller';

const router = Router();

router.use(authenticate);

// ── Dashboard & Analytics ─────────────────────────────────────────────────────
router.get('/dashboard', authorize('admin', 'superadmin'), getAdminDashboard);
router.get('/analytics', authorize('admin', 'superadmin'), getAnalytics);

// ── Student search (Roll Number OR Username) ──────────────────────────────────
router.get('/students/search', authorize('admin', 'superadmin'), searchStudent);

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students', authorize('admin', 'superadmin'), getStudents);
router.post('/students', authorize('admin', 'superadmin'), createStudent);
router.patch('/students/marks/bulk', authorize('admin', 'superadmin'), bulkUpdateMarks);
router.get('/students/:studentId/marks', authorize('admin', 'superadmin'), getStudentMarks);
router.put('/students/:id', authorize('admin', 'superadmin'), updateStudent);
router.patch('/students/:id/marks', authorize('admin', 'superadmin'), updateStudentMarks);
router.delete('/students/:id', authorize('superadmin'), deleteStudent);

// ── Faculty ───────────────────────────────────────────────────────────────────
router.get('/faculty', authorize('admin', 'superadmin'), getFacultyList);
router.post('/faculty', authorize('admin', 'superadmin'), createFaculty);
router.put('/faculty/:id', authorize('admin', 'superadmin'), updateFaculty);
router.delete('/faculty/:id', authorize('superadmin'), deleteFaculty);

// ── Admins (superadmin only) ──────────────────────────────────────────────────
router.get('/admins', authorize('superadmin'), getAdmins);
router.delete('/admins/:id', authorize('superadmin'), deleteAdmin);

// ── Branches (admin-managed, course-linked) ───────────────────────────────────
router.get('/branches', authorize('admin', 'superadmin'), getBranches);
router.post('/branches', authorize('admin', 'superadmin'), createBranch);
router.put('/branches/:id', authorize('admin', 'superadmin'), updateBranch);
router.delete('/branches/:id', authorize('admin', 'superadmin'), deleteBranch);

// ── Timetable CRUD ────────────────────────────────────────────────────────────
router.get('/timetable', authorize('admin', 'superadmin'), getTimetable);
router.post('/timetable', authorize('admin', 'superadmin'), createTimetableEntry);
router.put('/timetable/:id', authorize('admin', 'superadmin'), updateTimetableEntry);
router.delete('/timetable/:id', authorize('admin', 'superadmin'), deleteTimetableEntry);
router.get('/teacher-schedule', authorize('admin', 'superadmin'), getTeacherSchedule);

// ── Courses CRUD ──────────────────────────────────────────────────────────────
router.get('/courses', authorize('admin', 'superadmin'), getCourses);
router.post('/courses', authorize('admin', 'superadmin'), createCourse);
router.put('/courses/:id', authorize('admin', 'superadmin'), updateCourse);
router.delete('/courses/:id', authorize('admin', 'superadmin'), deleteCourse);

export default router;
