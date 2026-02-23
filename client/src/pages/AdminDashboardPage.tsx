import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/services';
import { useSocket } from '../services/useSocket';
import SettingsPage from './SettingsPage';
import { Search, Users, GraduationCap, BarChart3, UserPlus, Trash2, Pencil, Plus, X, Calendar, BookOpen, ShieldCheck } from 'lucide-react';

const COURSES = ['BTech', 'MTech', 'BPharma'];

interface AdminDashData {
    totalStudents: number;
    totalFaculty: number;
    attendanceRate: number;
    recentStudents: { username: string; rollOrId: string; createdAt: string }[];
    recentFaculty: { username: string; rollOrId: string; createdAt: string }[];
}

interface TimetableEntry {
    _id: string;
    courseId: { _id: string; name: string; code: string };
    facultyId: { _id: string; name: string; department: string };
    branch: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    isLive: boolean;
}

interface Course {
    _id: string;
    name: string;
    code: string;
    branch: string;
    semester: number;
    facultyId: { _id: string; name: string } | string;
}

interface TeacherScheduleGroup {
    faculty: { name: string; department: string };
    entries: TimetableEntry[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface BranchDoc { _id: string; name: string; course: string; }

const AdminDashboardPage: React.FC = () => {
    const { state } = useAuth();
    const isSuperAdmin = state.user?.role === 'superadmin';
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<AdminDashData | null>(null);
    const [search, setSearch] = useState('');

    // Timetable state
    const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
    const [timetableBranch, setTimetableBranch] = useState('all');
    const [showTimetableForm, setShowTimetableForm] = useState(false);
    const [ttForm, setTtForm] = useState({ courseId: '', facultyId: '', branch: '', dayOfWeek: '', startTime: '', endTime: '', room: '', lectureNumber: 1 });
    const [ttMsg, setTtMsg] = useState('');
    const [ttLoading, setTtLoading] = useState(false);
    const [editEntry, setEditEntry] = useState<TimetableEntry | null>(null);

    // Teacher schedule
    const [teacherSchedule, setTeacherSchedule] = useState<TeacherScheduleGroup[]>([]);

    // Courses state
    const [courses, setCourses] = useState<Course[]>([]);
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [courseForm, setCourseForm] = useState({ name: '', code: '', branch: '', semester: 1, facultyId: '' });
    const [courseMsg, setCourseMsg] = useState('');
    const [courseLoading, setCourseLoading] = useState(false);

    // Students/Faculty list
    const [students, setStudents] = useState<{ _id: string; name: string; rollNo: string; branch: string; semester: number; userId?: { username: string } }[]>([]);
    const [faculty, setFaculty] = useState<{ _id: string; name: string; employeeId: string; department: string; userId?: { username: string } }[]>([]);

    // Admins list (superadmin only)
    const [admins, setAdmins] = useState<{ _id: string; username: string; rollOrId: string; phone: string; createdAt: string }[]>([]);

    // Branches (admin-managed)
    const [branchDocs, setBranchDocs] = useState<BranchDoc[]>([]);
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [branchForm, setBranchForm] = useState({ name: '', course: '', description: '' });
    const [branchMsg, setBranchMsg] = useState('');
    const [branchLoading, setBranchLoading] = useState(false);
    // Branches available for currently selected course in timetable/course forms
    const [ttBranchOptions, setTtBranchOptions] = useState<BranchDoc[]>([]);

    // Student search
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResult, setStudentSearchResult] = useState<{
        user: { username: string; rollOrId: string; phone: string };
        student: { name: string; rollNo: string; course: string; branch: string; semester: number };
        attendanceRate: number; totalClasses: number;
        marks: { totalMarks: number; averageMarks: number; reviewedCount: number };
        assignmentHistory: { title: string; dueDate: string; submitted: boolean; grade?: number; isReviewed: boolean }[];
    } | null>(null);
    const [studentSearchLoading, setStudentSearchLoading] = useState(false);
    const [studentSearchError, setStudentSearchError] = useState('');

    // Marks edit modal
    const [editMarksStudent, setEditMarksStudent] = useState<{ _id: string; name: string } | null>(null);
    const [marksForm, setMarksForm] = useState({ totalMarks: 0, averageMarks: 0, entries: [] as any[] });
    const [marksMsg, setMarksMsg] = useState('');
    const [showBulkMarksModal, setShowBulkMarksModal] = useState(false);
    const [bulkMarksForm, setBulkMarksForm] = useState({ totalMarks: '', averageMarks: '' });
    const [bulkMarksMsg, setBulkMarksMsg] = useState('');

    const fetchDashboard = useCallback(async () => {
        try { const d = await adminService.getDashboard(); setData(d); } catch { /* ignore */ }
    }, []);
    const fetchTimetable = async () => {
        try { const d = await adminService.getTimetable(timetableBranch); setTimetable(d); } catch { /* ignore */ }
    };
    const fetchTeacherSchedule = async () => {
        try { const d = await adminService.getTeacherSchedule(); setTeacherSchedule(d); } catch { /* ignore */ }
    };
    const fetchCourses = async () => {
        try { const d = await adminService.getCourses(); setCourses(d); } catch { /* ignore */ }
    };
    const fetchStudents = async () => {
        try { const d = await adminService.getStudents(); setStudents(d); } catch { /* ignore */ }
    };
    const fetchFaculty = async () => {
        try { const d = await adminService.getFaculty(); setFaculty(d); } catch { /* ignore */ }
    };
    const fetchAdmins = async () => {
        try { const d = await adminService.getAdmins(); setAdmins(d); } catch { /* ignore */ }
    };

    const fetchBranches = useCallback(async () => {
        try { const d = await adminService.getBranches(); setBranchDocs(d); } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // Real-time: subscribe to admin room
    useSocket('admin', {
        'marks:updated': () => fetchDashboard(),
        'attendance:updated': () => fetchDashboard(),
        'timetable:updated': () => {
            if (activeTab === 'timetable') fetchTimetable();
            if (activeTab === 'teacherSchedule') fetchTeacherSchedule();
        },
    });

    useEffect(() => {
        if (activeTab === 'timetable') { fetchTimetable(); fetchCourses(); fetchFaculty(); fetchBranches(); }
        if (activeTab === 'teacherSchedule') fetchTeacherSchedule();
        if (activeTab === 'courses') { fetchCourses(); fetchFaculty(); fetchBranches(); }
        if (activeTab === 'branches') fetchBranches();
        if (activeTab === 'students') { fetchStudents(); }
        if (activeTab === 'faculty') fetchFaculty();
        if (activeTab === 'admins') fetchAdmins();
    }, [activeTab, timetableBranch, fetchDashboard, fetchBranches]);

    // Student search handler
    const handleStudentSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentSearchQuery.trim()) return;
        setStudentSearchLoading(true);
        setStudentSearchError('');
        setStudentSearchResult(null);
        try {
            const data = await adminService.searchStudent(studentSearchQuery.trim());
            setStudentSearchResult(data);
        } catch {
            setStudentSearchError('No student found with that Roll Number or Username.');
        } finally {
            setStudentSearchLoading(false);
        }
    };

    // Dynamic branch loading when course changes in forms
    const loadBranchesForCourse = useCallback(async (course: string, setter: (b: BranchDoc[]) => void) => {
        if (!course) { setter([]); return; }
        try { const d = await adminService.getBranches(course); setter(d); } catch { setter([]); }
    }, []);

    // Branch CRUD
    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        setBranchMsg('');
        setBranchLoading(true);
        try {
            await adminService.createBranch(branchForm);
            setBranchForm({ name: '', course: '', description: '' });
            setShowBranchForm(false);
            await fetchBranches();
        } catch (err: unknown) {
            setBranchMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create branch');
        } finally { setBranchLoading(false); }
    };

    const handleDeleteBranch = async (id: string) => {
        if (!confirm('Delete this branch? Students with this branch will keep their existing branch value.')) return;
        try { await adminService.deleteBranch(id); await fetchBranches(); } catch { /* ignore */ }
    };

    const handleCreateOrUpdateTimetable = async (e: React.FormEvent) => {
        e.preventDefault();
        setTtMsg('');
        setTtLoading(true);
        try {
            if (editEntry) {
                await adminService.updateTimetableEntry(editEntry._id, ttForm);
            } else {
                await adminService.createTimetableEntry(ttForm);
            }
            setShowTimetableForm(false);
            setEditEntry(null);
            setTtForm({ courseId: '', facultyId: '', branch: '', dayOfWeek: '', startTime: '', endTime: '', room: '', lectureNumber: 1 });
            await fetchTimetable();
        } catch (err: unknown) {
            setTtMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
        } finally { setTtLoading(false); }
    };

    const handleDeleteTimetable = async (id: string) => {
        if (!confirm('Delete this timetable entry?')) return;
        try { await adminService.deleteTimetableEntry(id); await fetchTimetable(); } catch { /* ignore */ }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setCourseMsg('');
        setCourseLoading(true);
        try {
            await adminService.createCourse(courseForm);
            setShowCourseForm(false);
            setCourseForm({ name: '', code: '', branch: '', semester: 1, facultyId: '' });
            await fetchCourses();
        } catch (err: unknown) {
            setCourseMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed');
        } finally { setCourseLoading(false); }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Delete this course?')) return;
        try { await adminService.deleteCourse(id); await fetchCourses(); } catch { /* ignore */ }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!confirm('Delete this student? (Superadmin only)')) return;
        try { await adminService.deleteStudent(id); await fetchStudents(); await fetchDashboard(); } catch { /* ignore */ }
    };

    const handleDeleteFaculty = async (id: string) => {
        if (!confirm('Delete this faculty member? (Superadmin only)')) return;
        try { await adminService.deleteFaculty(id); await fetchFaculty(); await fetchDashboard(); } catch { /* ignore */ }
    };

    const handleDeleteAdmin = async (id: string) => {
        if (!confirm('Delete this college admin?')) return;
        try { await adminService.deleteAdminUser(id); await fetchAdmins(); } catch { /* ignore */ }
    };

    const handleSaveMarks = async () => {
        if (!editMarksStudent) return;
        try {
            await adminService.updateStudentMarks(editMarksStudent._id, marksForm);
            setMarksMsg('Marks updated!');
            setTimeout(() => { setEditMarksStudent(null); setMarksMsg(''); }, 1200);
        } catch { setMarksMsg('Failed to update marks'); }
    };

    const handleBulkMarksUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {};
            if (bulkMarksForm.totalMarks !== '') payload.totalMarks = Number(bulkMarksForm.totalMarks);
            if (bulkMarksForm.averageMarks !== '') payload.averageMarks = Number(bulkMarksForm.averageMarks);

            await adminService.bulkUpdateMarks(payload);
            setBulkMarksMsg('Marks updated for all students!');
            setTimeout(() => { setShowBulkMarksModal(false); setBulkMarksMsg(''); }, 1200);
        } catch { setBulkMarksMsg('Failed to update bulk marks'); }
    };

    // ── Render helpers ──────────────────────────────────────────────────────────

    const renderDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#EFF6FF' }}><Users size={22} color="#2563EB" /></div>
                    <div className="stat-value">{data?.totalStudents ?? '—'}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#F0FDF4' }}><GraduationCap size={22} color="#10B981" /></div>
                    <div className="stat-value">{data?.totalFaculty ?? '—'}</div>
                    <div className="stat-label">Total Faculty</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#FFFBEB' }}><BarChart3 size={22} color="#F59E0B" /></div>
                    <div className="stat-value">{data?.attendanceRate ?? 0}%</div>
                    <div className="stat-label">Attendance Rate</div>
                </div>
            </div>
            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><span className="card-title">Recent Student Registrations</span></div>
                    {(data?.recentStudents || []).map((s, i) => (
                        <div key={i} className="activity-item">
                            <div className="activity-dot" />
                            <div className="activity-text"><b>{s.username}</b> — {s.rollOrId}</div>
                            <div className="activity-time">{new Date(s.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {(!data?.recentStudents || data.recentStudents.length === 0) && <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No students yet</p>}
                </div>
                <div className="card">
                    <div className="card-header"><span className="card-title">Recent Faculty Registrations</span></div>
                    {(data?.recentFaculty || []).map((f, i) => (
                        <div key={i} className="activity-item">
                            <div className="activity-dot" style={{ background: '#10B981' }} />
                            <div className="activity-text"><b>{f.username}</b> — {f.rollOrId}</div>
                            <div className="activity-time">{new Date(f.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                    {(!data?.recentFaculty || data.recentFaculty.length === 0) && <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No faculty yet</p>}
                </div>
            </div>
        </>
    );

    const renderTimetable = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Timetable Management</span>
                <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => { setEditEntry(null); setTtForm({ courseId: '', facultyId: '', branch: '', dayOfWeek: '', startTime: '', endTime: '', room: '', lectureNumber: 1 }); setTtBranchOptions([]); setShowTimetableForm(true); }}>
                    <Plus size={14} /> Add Entry
                </button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['all', ...COURSES].map(b => (
                    <button key={b} onClick={() => setTimetableBranch(b)} className="btn btn-sm btn-outline"
                        style={{ borderColor: timetableBranch === b ? 'var(--primary)' : 'var(--border)', color: timetableBranch === b ? 'var(--primary)' : 'var(--text)', background: timetableBranch === b ? '#EFF6FF' : 'white' }}>
                        {b === 'all' ? 'All Courses' : b}
                    </button>
                ))}
            </div>
            <table className="manage-table">
                <thead><tr><th>Branch</th><th>Course</th><th>Faculty</th><th>Day</th><th>Time</th><th>Room</th><th>Actions</th></tr></thead>
                <tbody>
                    {timetable.map(t => (
                        <tr key={t._id}>
                            <td><span className="badge badge-subject">{t.branch}</span></td>
                            <td><b>{typeof t.courseId === 'object' ? t.courseId.name : String(t.courseId)}</b></td>
                            <td>{typeof t.facultyId === 'object' ? t.facultyId.name : String(t.facultyId)}</td>
                            <td>{t.dayOfWeek}</td>
                            <td style={{ fontSize: '0.85rem' }}>{t.startTime} – {t.endTime}</td>
                            <td>{t.room}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'white' }}
                                    onClick={() => { setEditEntry(t); setTtForm({ courseId: (t.courseId as { _id: string })?._id || '', facultyId: (t.facultyId as { _id: string })?._id || '', branch: t.branch, dayOfWeek: t.dayOfWeek, startTime: t.startTime, endTime: t.endTime, room: t.room, lectureNumber: 1 }); setShowTimetableForm(true); }}>
                                    <Pencil size={12} />
                                </button>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                    onClick={() => handleDeleteTimetable(t._id)}>
                                    <Trash2 size={12} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {timetable.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No entries. Add timetable entries above.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderBranches = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Branch Management</span>
                <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => { setBranchForm({ name: '', course: '', description: '' }); setBranchMsg(''); setShowBranchForm(true); }}>
                    <Plus size={14} /> Add Branch
                </button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Branches are linked to a specific Course (degree). Students can only sign up for branches you create here.
            </p>
            <table className="manage-table">
                <thead><tr><th>Branch Name</th><th>Course (Degree)</th><th>Actions</th></tr></thead>
                <tbody>
                    {branchDocs.map(b => (
                        <tr key={b._id}>
                            <td><b>{b.name}</b></td>
                            <td><span className="badge badge-subject">{b.course}</span></td>
                            <td>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                    onClick={() => handleDeleteBranch(b._id)}><Trash2 size={12} /></button>
                            </td>
                        </tr>
                    ))}
                    {branchDocs.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No branches yet. Add branches so students can select them at signup.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderCourses = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><BookOpen size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Subjects (Courses)</span>
                <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => { setCourseForm({ name: '', code: '', branch: '', semester: 1, facultyId: '' }); setShowCourseForm(true); }}>
                    <Plus size={14} /> Add Subject
                </button>
            </div>
            <table className="manage-table">
                <thead><tr><th>Name</th><th>Code</th><th>Branch</th><th>Semester</th><th>Faculty</th><th>Actions</th></tr></thead>
                <tbody>
                    {courses.map(c => (
                        <tr key={c._id}>
                            <td><b>{c.name}</b></td>
                            <td>{c.code}</td>
                            <td><span className="badge badge-subject">{c.branch}</span></td>
                            <td>Sem {c.semester}</td>
                            <td>{typeof c.facultyId === 'object' ? c.facultyId.name : '—'}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                    onClick={() => handleDeleteCourse(c._id)}><Trash2 size={12} /></button>
                            </td>
                        </tr>
                    ))}
                    {courses.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No courses yet. Add a course first — then it will appear in the timetable and assignment dropdowns.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderTeacherSchedule = () => (
        <div className="card">
            <div className="card-header"><span className="card-title"><Calendar size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />Teacher Schedules (Derived from Timetable)</span></div>
            {teacherSchedule.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No teacher schedule yet. Add timetable entries first.</p>}
            {teacherSchedule.map((g, i) => (
                <div key={i} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                        {g.faculty.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>— {g.faculty.department}</span>
                    </div>
                    <div className="timetable-list">
                        {g.entries.map((t: TimetableEntry) => (
                            <div key={t._id} className="timetable-row">
                                <div className="timetable-time">{t.startTime}</div>
                                <div className="timetable-subject">
                                    <div className="subject-name">{t.courseId?.name || String(t.courseId)}</div>
                                    <div className="subject-meta">{t.dayOfWeek} · Branch: {t.branch} · {t.room}</div>
                                </div>
                                {t.isLive && <span className="badge badge-live">Live</span>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStudents = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Manage Students</span>
                <button className="btn btn-primary btn-sm"><UserPlus size={14} /> Add Student</button>
            </div>

            {/* Student Search */}
            <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)' }}>🔍 Student Search (Roll Number or Username)</p>
                <form onSubmit={handleStudentSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="Enter Roll Number or Username..."
                        value={studentSearchQuery} onChange={e => setStudentSearchQuery(e.target.value)} />
                    <button type="submit" className="btn btn-primary" disabled={studentSearchLoading}>
                        {studentSearchLoading ? '...' : 'Search'}
                    </button>
                </form>
                {studentSearchError && <p style={{ color: '#DC2626', fontSize: '0.85rem' }}>{studentSearchError}</p>}
                {studentSearchResult && (
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div><b>Name:</b> {studentSearchResult.student.name}</div>
                            <div><b>Roll No:</b> {studentSearchResult.student.rollNo}</div>
                            <div><b>Username:</b> {studentSearchResult.user.username}</div>
                            <div><b>Course:</b> {studentSearchResult.student.course}</div>
                            <div><b>Branch:</b> {studentSearchResult.student.branch}</div>
                            <div><b>Semester:</b> {studentSearchResult.student.semester}</div>
                            <div><b>Attendance:</b> <span style={{ color: studentSearchResult.attendanceRate >= 75 ? '#10B981' : '#DC2626', fontWeight: 600 }}>{studentSearchResult.attendanceRate}%</span> ({studentSearchResult.totalClasses} classes)</div>
                            <div><b>Total Marks:</b> {studentSearchResult.marks.totalMarks} | Avg: {studentSearchResult.marks.averageMarks}</div>
                        </div>
                        {studentSearchResult.assignmentHistory.length > 0 && (
                            <>
                                <p style={{ fontWeight: 500, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Assignment History</p>
                                <table className="manage-table" style={{ fontSize: '0.82rem' }}>
                                    <thead><tr><th>Title</th><th>Due Date</th><th>Submitted</th><th>Grade</th></tr></thead>
                                    <tbody>
                                        {studentSearchResult.assignmentHistory.map((a, i) => (
                                            <tr key={i}>
                                                <td>{a.title}</td>
                                                <td>{new Date(a.dueDate).toLocaleDateString()}</td>
                                                <td>{a.submitted ? '✅' : '❌'}</td>
                                                <td>{a.isReviewed && a.grade !== undefined ? a.grade : a.submitted ? 'Pending' : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
            </div>

            <table className="manage-table">
                <thead><tr><th>Name</th><th>Roll No</th><th>Branch</th><th>Semester</th><th>Actions</th></tr></thead>
                <tbody>
                    {students.filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search)).map((s) => (
                        <tr key={s._id}>
                            <td><b>{s.name || s.userId?.username}</b></td>
                            <td>{s.rollNo}</td>
                            <td><span className="badge badge-subject">{s.branch}</span></td>
                            <td>{s.semester}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {/* Edit marks — admin + superadmin */}
                                <button className="btn btn-sm btn-outline" title="Edit Marks"
                                    style={{ borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}
                                    onClick={async () => {
                                        setEditMarksStudent({ _id: s._id, name: s.name });
                                        try {
                                            const marksData = await adminService.getStudentMarks(s._id);
                                            setMarksForm({ totalMarks: marksData.totalMarks || 0, averageMarks: marksData.averageMarks || 0, entries: marksData.entries || [] });
                                        } catch {
                                            setMarksForm({ totalMarks: 0, averageMarks: 0, entries: [] });
                                        }
                                        setMarksMsg('');
                                    }}>
                                    <Pencil size={12} />
                                </button>
                                {/* Delete — superadmin only */}
                                {isSuperAdmin && (
                                    <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                        onClick={() => handleDeleteStudent(s._id)}><Trash2 size={12} /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No students yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderFaculty = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Manage Faculty</span>
                <button className="btn btn-primary btn-sm"><UserPlus size={14} /> Add Faculty</button>
            </div>
            <table className="manage-table">
                <thead><tr><th>Name</th><th>Employee ID</th><th>Department</th><th>Actions</th></tr></thead>
                <tbody>
                    {faculty.filter(f => !search || f.name?.toLowerCase().includes(search.toLowerCase())).map((f) => (
                        <tr key={f._id}>
                            <td><b>{f.name || f.userId?.username}</b></td>
                            <td>{f.employeeId}</td>
                            <td>{f.department}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                {/* Delete — superadmin only */}
                                {isSuperAdmin && (
                                    <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                        onClick={() => handleDeleteFaculty(f._id)}><Trash2 size={12} /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {faculty.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No faculty yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    const renderAdmins = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title"><ShieldCheck size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />College Admins (Superadmin View)</span>
            </div>
            <table className="manage-table">
                <thead><tr><th>Username</th><th>ID</th><th>Phone</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                    {admins.map(a => (
                        <tr key={a._id}>
                            <td><b>{a.username}</b></td>
                            <td>{a.rollOrId}</td>
                            <td>{a.phone}</td>
                            <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}
                                    onClick={() => handleDeleteAdmin(a._id)}><Trash2 size={12} /></button>
                            </td>
                        </tr>
                    ))}
                    {admins.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No college admins yet.</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar role="admin" activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="main-content">
                <div className="search-bar-wrap">
                    <div className="search-bar">
                        <Search size={16} color="#94a3b8" />
                        <input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                {activeTab === 'dashboard' && (
                    <div className="welcome-section">
                        <h1>{isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard</h1>
                        <p>Overview of the Smart College Management System.</p>
                    </div>
                )}
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'timetable' && renderTimetable()}
                {activeTab === 'teacherSchedule' && renderTeacherSchedule()}
                {activeTab === 'branches' && renderBranches()}
                {activeTab === 'courses' && renderCourses()}
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'faculty' && renderFaculty()}
                {activeTab === 'admins' && isSuperAdmin && renderAdmins()}
                {activeTab === 'settings' && <SettingsPage />}
            </main>

            {/* Timetable Create/Edit Modal */}
            {showTimetableForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{editEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h3>
                            <button onClick={() => { setShowTimetableForm(false); setEditEntry(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {ttMsg && <p style={{ color: '#DC2626', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{ttMsg}</p>}
                        <form onSubmit={handleCreateOrUpdateTimetable} className="auth-form">
                            <div className="form-group">
                                <label>Course (Degree) <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={(ttForm as unknown as { course: string }).course || ''}
                                    onChange={e => {
                                        const c = e.target.value;
                                        setTtForm((f: typeof ttForm) => ({ ...f, course: c, branch: '' }));
                                        loadBranchesForCourse(c, setTtBranchOptions);
                                    }} required>
                                    <option value="">Select Course (Degree)</option>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Branch <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={ttForm.branch} onChange={e => setTtForm(f => ({ ...f, branch: e.target.value }))} required
                                    disabled={ttBranchOptions.length === 0}>
                                    <option value="">{ttBranchOptions.length === 0 ? 'Select a Course first' : 'Select Branch'}</option>
                                    {ttBranchOptions.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Course <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={ttForm.courseId} onChange={e => setTtForm(f => ({ ...f, courseId: e.target.value }))} required>
                                    <option value="">Select Course</option>
                                    {courses.length === 0 && <option disabled>No courses — add courses first</option>}
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.code}) — {c.branch}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Faculty <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={ttForm.facultyId} onChange={e => setTtForm(f => ({ ...f, facultyId: e.target.value }))} required>
                                    <option value="">Select Faculty</option>
                                    {faculty.map(f => (
                                        <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Day of Week <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={ttForm.dayOfWeek} onChange={e => setTtForm(f => ({ ...f, dayOfWeek: e.target.value }))} required>
                                    <option value="">Select Day</option>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input type="time" className="form-input" value={ttForm.startTime} onChange={e => setTtForm(f => ({ ...f, startTime: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input type="time" className="form-input" value={ttForm.endTime} onChange={e => setTtForm(f => ({ ...f, endTime: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Room Number <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. Room 101" value={ttForm.room} onChange={e => setTtForm(f => ({ ...f, room: e.target.value }))} required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={ttLoading}>
                                {ttLoading ? 'Saving...' : (editEntry ? 'Update Entry' : 'Add Entry')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Course Create Modal */}
            {showCourseForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Add Subject</h3>
                            <button onClick={() => setShowCourseForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {courseMsg && <p style={{ color: '#DC2626', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{courseMsg}</p>}
                        <form onSubmit={handleCreateCourse} className="auth-form">
                            <div className="form-group">
                                <label>Subject Name <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. Computer Science" value={courseForm.name} onChange={e => setCourseForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Subject Code <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. CS201" value={courseForm.code} onChange={e => setCourseForm(f => ({ ...f, code: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Course <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={courseForm.branch} onChange={e => setCourseForm(f => ({ ...f, branch: e.target.value }))} required>
                                    <option value="">Select Course</option>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Semester <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" min={1} max={8} className="form-input" value={courseForm.semester} onChange={e => setCourseForm(f => ({ ...f, semester: Number(e.target.value) }))} required />
                            </div>
                            <div className="form-group">
                                <label>Faculty <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={courseForm.facultyId} onChange={e => setCourseForm(f => ({ ...f, facultyId: e.target.value }))} required>
                                    <option value="">Select Faculty</option>
                                    {faculty.map(f => (
                                        <option key={f._id} value={f._id}>{f.name} — {f.department}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={courseLoading}>
                                {courseLoading ? 'Creating...' : 'Add Subject'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Branch Create Modal */}
            {showBranchForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Add Branch</h3>
                            <button onClick={() => setShowBranchForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {branchMsg && <p style={{ color: '#DC2626', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{branchMsg}</p>}
                        <form onSubmit={handleCreateBranch} className="auth-form">
                            <div className="form-group">
                                <label>Course (Degree) <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={branchForm.course}
                                    onChange={e => setBranchForm(f => ({ ...f, course: e.target.value }))} required>
                                    <option value="">Select Course</option>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Branch Name <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. Artificial Intelligence" value={branchForm.name}
                                    onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <input className="form-input" placeholder="e.g. AI & ML specialisation" value={branchForm.description}
                                    onChange={e => setBranchForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={branchLoading}>
                                {branchLoading ? 'Creating...' : 'Add Branch'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Marks Modal */}
            {editMarksStudent && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Edit Marks — {editMarksStudent.name}</h3>
                            <button onClick={() => setEditMarksStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {marksMsg && <p style={{ color: marksMsg.includes('!') ? '#16A34A' : '#DC2626', marginBottom: '0.5rem' }}>{marksMsg}</p>}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Total Marks <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" className="form-input" value={marksForm.totalMarks}
                                    onChange={e => setMarksForm(f => ({ ...f, totalMarks: Number(e.target.value) }))} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Average Marks <span style={{ color: 'red' }}>*</span></label>
                                <input type="number" className="form-input" value={marksForm.averageMarks}
                                    onChange={e => setMarksForm(f => ({ ...f, averageMarks: Number(e.target.value) }))} required />
                            </div>
                        </div>

                        {marksForm.entries?.length > 0 && (
                            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-light)' }}>Individual Assignment Marks</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {marksForm.entries.map((entry: any, idx: number) => (
                                        <div key={entry.assignmentId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>{entry.assignmentTitle}</div>
                                            <div style={{ width: '100px' }}>
                                                <input type="number" className="form-input" value={entry.marks}
                                                    onChange={e => {
                                                        const newEntries = [...marksForm.entries];
                                                        newEntries[idx].marks = Number(e.target.value);
                                                        setMarksForm(f => ({ ...f, entries: newEntries }));
                                                    }} style={{ padding: '0.4rem', height: 'auto' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="btn btn-primary btn-full" onClick={handleSaveMarks}>Save Marks</button>
                    </div>
                </div>
            )}

            {/* Bulk Marks Modal */}
            {showBulkMarksModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Set Baseline Marks (All)</h3>
                            <button onClick={() => setShowBulkMarksModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>Set default total and average marks for every student in the system.</p>
                        {bulkMarksMsg && <p style={{ color: bulkMarksMsg.includes('!') ? '#16A34A' : '#DC2626', marginBottom: '0.5rem' }}>{bulkMarksMsg}</p>}

                        <form onSubmit={handleBulkMarksUpdate} className="auth-form">
                            <div className="form-group">
                                <label>Total Marks (Baseline)</label>
                                <input type="number" className="form-input" placeholder="e.g. 100" value={bulkMarksForm.totalMarks}
                                    onChange={e => setBulkMarksForm(f => ({ ...f, totalMarks: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Average Marks (Baseline)</label>
                                <input type="number" className="form-input" placeholder="e.g. 50" value={bulkMarksForm.averageMarks}
                                    onChange={e => setBulkMarksForm(f => ({ ...f, averageMarks: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">
                                Update All Students
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
