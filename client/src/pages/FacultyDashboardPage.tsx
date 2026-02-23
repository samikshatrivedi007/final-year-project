import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { facultyService } from '../services/services';
import { useSocket } from '../services/useSocket';
import SettingsPage from './SettingsPage';
import { Search, Plus, X, CheckCircle, Download, Eye } from 'lucide-react';
import { getClassStatus } from '../utils/time';

const SERVER_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const resolveFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http') || fileUrl.startsWith('data:')) return fileUrl;
    return `${SERVER_BASE}${fileUrl}`;
};

const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);


interface TimetableEntry {
    _id: string;
    courseId: { _id: string; name: string; code: string; branch?: string };
    course: string;
    branch: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    isLive: boolean;
    lectureNumber: number;
}

interface Submission {
    _id: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    branch: string;
    submittedAt: string;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
    isReviewed: boolean;
}

interface Assignment {
    _id: string;
    title: string;
    description: string;
    courseId: { _id: string; name: string };
    branch: string;
    dueDate: string;
    submissions: Submission[];
}

interface FacultyDashData {
    faculty: { name: string; employeeId: string; department: string };
    schedule: TimetableEntry[];
    assignments: Assignment[];
    totalSubmissions: number;
    pendingReviews: number;
    attendanceRate: number;
    happeningNow: TimetableEntry | null;
}

const BRANCHES = ['AI', 'DS', 'Core CS', 'Electronics'];

const FacultyDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<FacultyDashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Create assignment modal
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(timer);
    }, []);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ courseId: '', course: '', branch: '', title: '', description: '', dueDate: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createMsg, setCreateMsg] = useState('');

    // Review modal
    const [reviewModal, setReviewModal] = useState<{ assignmentId: string; submission: Submission } | null>(null);
    const [reviewForm, setReviewForm] = useState({ grade: '', feedback: '' });
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewMsg, setReviewMsg] = useState('');
    const [reviewSubmissions, setReviewSubmissions] = useState<Submission[]>([]);

    // Attendance modal
    const [attendanceModal, setAttendanceModal] = useState<TimetableEntry | null>(null);
    const [students, setStudents] = useState<{ _id: string; name: string; rollNo: string }[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
    const [attendanceLoading, setAttendanceLoading] = useState(false);

    // Courses list for assignment form
    const [courses, setCourses] = useState<{ _id: string; name: string; code: string; branch: string }[]>([]);

    const fetchDashboard = useCallback(async () => {
        try {
            const d = await facultyService.getDashboard();
            setData(d);
        } catch { /* keep null */ }
        finally { setLoading(false); }
    }, []);

    const fetchCourses = async () => {
        try { const d = await facultyService.getCourses(); setCourses(d); } catch { /* ignore */ }
    };

    useEffect(() => { fetchDashboard(); fetchCourses(); }, [fetchDashboard]);

    // Real-time socket: join faculty room
    useSocket('faculty', {
        'timetable:updated': () => fetchDashboard(),
        'marks:updated': () => fetchDashboard(),
    });

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateMsg('');
        setCreateLoading(true);
        try {
            await facultyService.createAssignment(createForm as Parameters<typeof facultyService.createAssignment>[0]);
            setShowCreateModal(false);
            setCreateForm({ courseId: '', course: '', branch: '', title: '', description: '', dueDate: '' });
            await fetchDashboard();
        } catch (err: unknown) {
            setCreateMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create assignment');
        } finally {
            setCreateLoading(false);
        }
    };

    const openReviewModal = async (assignment: Assignment) => {
        try {
            const result = await facultyService.getSubmissions(assignment._id);
            setReviewSubmissions(result.submissions || []);
            if (result.submissions?.length > 0) {
                setReviewModal({ assignmentId: assignment._id, submission: result.submissions[0] });
                setReviewForm({ grade: '', feedback: '' });
                setReviewMsg('');
            }
        } catch { /* ignore */ }
    };

    const handleGrade = async (targetStudentId: string) => {
        if (!reviewModal) return;
        if (!reviewForm.grade) { setReviewMsg('Grade is required'); return; }
        setReviewLoading(true);
        try {
            await facultyService.gradeSubmission(reviewModal.assignmentId, {
                studentId: targetStudentId,
                grade: Number(reviewForm.grade),
                feedback: reviewForm.feedback,
            });
            setReviewMsg('');
            // Refresh submissions
            const result = await facultyService.getSubmissions(reviewModal.assignmentId);
            setReviewSubmissions(result.submissions || []);
            await fetchDashboard();
        } catch (err: unknown) {
            setReviewMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to grade');
        } finally {
            setReviewLoading(false);
        }
    };

    const openAttendanceModal = async (entry: TimetableEntry) => {
        const branch = entry.courseId.branch || '';
        if (!branch) { alert('No branch info on this class'); return; }
        try {
            const list = await facultyService.getStudentsByCourseAndBranch(entry.course, branch);
            setStudents(list);
            const defaultRecords: Record<string, string> = {};
            list.forEach((s: { _id: string }) => { defaultRecords[s._id] = 'present'; });
            setAttendanceRecords(defaultRecords);
            setAttendanceModal(entry);
        } catch { alert('Failed to load students'); }
    };

    const handleMarkAttendance = async () => {
        if (!attendanceModal) return;
        setAttendanceLoading(true);
        try {
            await facultyService.markAttendance({
                courseId: attendanceModal.courseId._id,
                timetableId: attendanceModal._id,
                records: students.map(s => ({ studentId: s._id, status: attendanceRecords[s._id] || 'absent' })),
            });
            setAttendanceModal(null);
            alert('Attendance marked successfully!');
        } catch { alert('Failed to mark attendance'); }
        finally { setAttendanceLoading(false); }
    };

    const handleToggleLive = async (entry: TimetableEntry) => {
        try {
            await facultyService.toggleLive(entry._id);
            await fetchDashboard();
        } catch { /* ignore */ }
    };

    const renderDashboard = () => {
        if (!data) return null;
        const pending = (data.assignments || []).filter(a => a.submissions.some(s => !s.isReviewed));
        return (
            <>
                <div className="dashboard-grid-main">
                    {data.happeningNow ? (
                        <div className="happening-now">
                            <div className="happening-badge">Happening Now</div>
                            <h2>{data.happeningNow.courseId.name}</h2>
                            <div className="details">{data.happeningNow.room}</div>
                            <div className="progress-wrap">
                                <div className="progress-bar"><div className="progress-fill" style={{ width: '62%' }} /></div>
                                <span className="progress-label">In progress</span>
                            </div>
                        </div>
                    ) : (
                        <div className="happening-now" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>No live class right now</div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card">
                            <div className="card-label">Overall Attendance</div>
                            <div className="card-value">{data.attendanceRate}%</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Total Assignment Submissions</div>
                            <div className="card-value">{data.totalSubmissions}</div>
                            <div className="card-sub">{data.pendingReviews} pending review.</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header"><span className="card-title">Today's Schedule</span></div>
                        <div className="timetable-list">
                            {(data.schedule || []).map((t, i) => (
                                <div key={t._id} className="timetable-row">
                                    <div className="timetable-time">
                                        {t.startTime.split(':')[0]}:{t.startTime.split(':')[1]?.split(' ')[0]}<br />
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.startTime.includes('AM') ? 'AM' : 'PM'}</span>
                                    </div>
                                    <div className="timetable-subject">
                                        <div className="subject-name">{t.courseId.name}</div>
                                        <div className="subject-meta">Lecture:-{i + 1} · {t.room}</div>
                                    </div>
                                    {(() => {
                                        const status = getClassStatus(t.dayOfWeek, t.startTime, t.endTime);
                                        if (t.isLive) return <span className="badge badge-live">Live</span>;
                                        if (status === 'upcoming') return <span className="badge" style={{ border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Upcoming</span>;
                                        if (status === 'completed') return <span className="badge" style={{ border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Completed</span>;
                                        return <span className="badge" style={{ border: '1px solid #bfdbfe', color: '#3b82f6', background: '#eff6ff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Ready</span>;
                                    })()}
                                </div>
                            ))}
                            {(!data.schedule || data.schedule.length === 0) && <p style={{ color: 'var(--text-muted)' }}>No classes today</p>}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Review Assignments</span>
                            <span className="view-all" onClick={() => setActiveTab('assignments')} style={{ cursor: 'pointer' }}>view all</span>
                        </div>
                        <div className="assignment-list">
                            {pending.slice(0, 4).map((a) => {
                                const unreviewedSub = a.submissions.find(s => !s.isReviewed);
                                return (
                                    <div key={a._id} className="assignment-row">
                                        <div className="assignment-info">
                                            <div className="asgn-name">{unreviewedSub?.studentName || 'Student'}</div>
                                            <div className="asgn-meta">
                                                <span className="badge badge-subject">{a.courseId.name}</span>
                                                <span className="due-text">Branch: {a.branch}</span>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm btn-outline"
                                            style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'white' }}
                                            onClick={() => openReviewModal(a)}>
                                            Review
                                        </button>
                                    </div>
                                );
                            })}
                            {pending.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No pending reviews</p>}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderSchedule = () => {
        if (!data) return null;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return (
            <div className="card">
                <div className="card-header"><span className="card-title">Full Schedule</span></div>
                {days.map(day => {
                    const entries = (data.schedule || []).filter(t => t.dayOfWeek === day);
                    if (entries.length === 0) return null;
                    return (
                        <div key={day} style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{day}</div>
                            <div className="timetable-list">
                                {entries.map((t, i) => {
                                    const status = getClassStatus(t.dayOfWeek, t.startTime, t.endTime);
                                    const statusText = status === 'upcoming' ? 'Upcoming' : status === 'completed' ? 'Completed' : t.isLive ? 'LIVE' : 'Ready to Start';
                                    const statusColor = status === 'completed' ? '#94a3b8' : status === 'upcoming' ? '#64748b' : t.isLive ? '#ef4444' : '#3b82f6';
                                    return (
                                        <div key={t._id} className="timetable-row">
                                            <div className="timetable-time">{t.startTime}</div>
                                            <div className="timetable-subject">
                                                <div className="subject-name">{t.courseId.name}</div>
                                                <div className="subject-meta">
                                                    {t.dayOfWeek} · Lecture {i + 1} · {t.room}
                                                    <span style={{ marginLeft: '0.75rem', fontWeight: 600, color: statusColor, fontSize: '0.75rem' }}>• {statusText}</span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                <button className="btn btn-sm btn-outline"
                                                    style={{ fontSize: '0.75rem', borderColor: '#BBF7D0', color: '#16A34A', background: '#F0FDF4' }}
                                                    onClick={() => openAttendanceModal(t)}>
                                                    Attendance
                                                </button>
                                                {status === 'active' && (
                                                    t.isLive
                                                        ? <button className="btn btn-sm badge-live" style={{ border: 'none', cursor: 'pointer' }} onClick={() => handleToggleLive(t)}>Stop Live</button>
                                                        : <button className="btn btn-sm btn-outline" style={{ fontSize: '0.75rem', borderColor: '#3B82F6', color: '#2563EB', background: '#DBEAFE' }} onClick={() => handleToggleLive(t)}>Go Live</button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {(!data.schedule || data.schedule.length === 0) && <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No schedule entries. Admin needs to add timetable entries for your faculty.</p>}
            </div>
        );
    };

    const renderAssignments = () => {
        const assignments = data?.assignments || [];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">All Assignments</span>
                        <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            onClick={() => setShowCreateModal(true)}>
                            <Plus size={14} /> Create Assignment
                        </button>
                    </div>
                    <div className="assignment-list">
                        {assignments.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No assignments created yet.</p>}
                        {assignments.map((a) => {
                            const reviewed = a.submissions.filter(s => s.isReviewed).length;
                            const total = a.submissions.length;
                            return (
                                <div key={a._id} className="assignment-row">
                                    <div className="assignment-info">
                                        <div className="asgn-name">{a.title}</div>
                                        <div className="asgn-meta">
                                            <span className="badge badge-subject">{a.courseId.name}</span>
                                            <span className="due-text">Branch: {a.branch}</span>
                                            <span className="due-text"> · Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                            <span style={{ color: '#10B981', fontSize: '0.8rem' }}> · {reviewed}/{total} reviewed</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-sm btn-primary" onClick={() => openReviewModal(a)}>
                                        Review ({total - reviewed} pending)
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <Sidebar role="faculty" activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="main-content">
                <div className="search-bar-wrap">
                    <div className="search-bar">
                        <Search size={16} color="#94a3b8" />
                        <input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                {activeTab === 'dashboard' && (
                    <div className="welcome-section">
                        <h1>Welcome back, {data?.faculty?.name || 'Teacher'} !</h1>
                        <p>Here's what's happening in your schedule today.</p>
                    </div>
                )}
                {loading ? (
                    <div className="loading"><div className="spinner" /><span>Loading...</span></div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'schedule' && renderSchedule()}
                        {activeTab === 'assignments' && renderAssignments()}
                        {activeTab === 'settings' && <SettingsPage />}
                    </>
                )}
            </main>

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Create Assignment</h3>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {createMsg && <p style={{ color: '#DC2626', marginBottom: '0.5rem' }}>{createMsg}</p>}
                        <form onSubmit={handleCreateAssignment} className="auth-form">
                            <div className="form-group">
                                <label>Course (Degree) <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={createForm.course}
                                    onChange={e => setCreateForm(f => ({ ...f, course: e.target.value }))} required>
                                    <option value="">Select Degree</option>
                                    {['BTech', 'MTech', 'BPharma'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Subject (Course) <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={createForm.courseId}
                                    onChange={e => setCreateForm(f => ({ ...f, courseId: e.target.value }))} required>
                                    <option value="">Select Subject</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.code}) — {c.branch}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Branch</label>
                                <select className="form-input" value={createForm.branch}
                                    onChange={e => setCreateForm(f => ({ ...f, branch: e.target.value }))} required>
                                    <option value="">Select Branch</option>
                                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title</label>
                                <input className="form-input" placeholder="Assignment title" value={createForm.title}
                                    onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input className="form-input" placeholder="Description (optional)" value={createForm.description}
                                    onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input type="date" className="form-input" value={createForm.dueDate}
                                    onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} required />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={createLoading}>
                                {createLoading ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Review Submissions</h3>
                            <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {reviewSubmissions.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No submissions yet.</p>}
                        {reviewSubmissions.map((sub, idx) => (
                            <div key={sub._id || idx} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{sub.studentName}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Roll: {sub.rollNo} · Branch: {sub.branch}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    {sub.isReviewed && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10B981', fontSize: '0.85rem' }}>
                                            <CheckCircle size={14} /> Reviewed · {sub.grade}/100
                                        </span>
                                    )}
                                </div>
                                {sub.fileUrl && (() => {
                                    const fullUrl = resolveFileUrl(sub.fileUrl);
                                    return (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            {isImage(sub.fileUrl) ? (
                                                <img src={fullUrl} alt="submission" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)', display: 'block', marginBottom: '0.5rem' }} />
                                            ) : (
                                                <div style={{ background: '#F8FAFC', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', flex: 1 }}>PDF Document</span>
                                                    <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                                                        className="btn btn-sm btn-outline"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                                        <Eye size={13} /> Open PDF
                                                    </a>
                                                </div>
                                            )}
                                            <a href={fullUrl} download
                                                className="btn btn-sm btn-outline"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', borderColor: '#10B981', color: '#10B981' }}>
                                                <Download size={13} /> Download
                                            </a>
                                        </div>
                                    );
                                })()}
                                {!sub.isReviewed && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        {reviewMsg && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{reviewMsg}</p>}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <input type="number" className="form-input" placeholder="Marks (0-100)" min={0} max={100}
                                                style={{ width: 140 }} value={reviewForm.grade}
                                                onChange={e => setReviewForm(f => ({ ...f, grade: e.target.value }))} />
                                            <input className="form-input" placeholder="Remarks (optional)"
                                                style={{ flex: 1 }} value={reviewForm.feedback}
                                                onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))} />
                                            <button className="btn btn-primary btn-sm" disabled={reviewLoading}
                                                onClick={async () => {
                                                    await handleGrade(sub.studentId);
                                                }}>
                                                {reviewLoading ? '...' : 'Final Review'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Modal */}
            {attendanceModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Mark Attendance — {attendanceModal.courseId.name}</h3>
                            <button onClick={() => setAttendanceModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {students.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No students in this branch.</p>}
                        {students.map(s => (
                            <div key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.rollNo}</div>
                                </div>
                                <select style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
                                    value={attendanceRecords[s._id] || 'present'}
                                    onChange={e => setAttendanceRecords(r => ({ ...r, [s._id]: e.target.value }))}>
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>
                        ))}
                        <button className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}
                            disabled={attendanceLoading} onClick={handleMarkAttendance}>
                            {attendanceLoading ? 'Marking...' : 'Mark Attendance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboardPage;
