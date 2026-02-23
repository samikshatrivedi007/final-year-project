import React, { useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { studentService } from '../services/services';
import { useSocket } from '../services/useSocket';
import SettingsPage from './SettingsPage';
import { Search, Upload, X, CheckCircle } from 'lucide-react';

const SERVER_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface TimetableEntry {
    _id: string;
    courseId: { _id: string; name: string; code: string };
    facultyId: { _id: string; name: string };
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
    isLive: boolean;
    lectureNumber: number;
}

interface MySubmission {
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
    mySubmission: MySubmission | null;
    canEdit: boolean;
}

interface DashboardData {
    student: { name: string; rollNo: string; semester: number; branch: string };
    timetable: TimetableEntry[];
    pendingAssignments: Assignment[];
    completedAssignments: Assignment[];
    totalAssignments: number;
    attendanceRate: number;
    happeningNow: TimetableEntry | null;
}

const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return 'Overdue';
    return days === 1 ? '1 day' : `${days} days`;
};

/** Make a file URL absolute (prepend server base if it's a /uploads path) */
const resolveFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    return `${SERVER_BASE}${fileUrl}`;
};

import { isClassActive } from '../utils/time';

const StudentDashboardPage: React.FC = () => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 30000);
        return () => clearInterval(timer);
    }, []);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Submit modal state
    const [submitModal, setSubmitModal] = useState<Assignment | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const fetchDashboard = useCallback(async () => {
        try {
            const d = await studentService.getDashboard();
            setData(d);
        } catch {
            // keep null
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    // Real-time socket: join student's branch room
    const branch = data?.student?.branch;
    useSocket(branch ? `branch:${branch}` : null, {
        'attendance:updated': () => fetchDashboard(),
        'marks:updated': () => fetchDashboard(),
        'class:live': () => fetchDashboard(),
        'assignment:created': () => fetchDashboard(),
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setFileName(file.name);
        setSubmitMsg('');
    };

    const handleSubmit = async () => {
        if (!submitModal) return;
        if (!selectedFile && !submitModal.mySubmission?.fileUrl) {
            setSubmitMsg('Please upload a file first');
            return;
        }

        setUploadLoading(true);
        setSubmitMsg('');

        try {
            let fileUrl = submitModal.mySubmission?.fileUrl || '';

            // Only upload if a new file was chosen
            if (selectedFile) {
                setUploadLoading(true);
                fileUrl = await studentService.uploadFile(selectedFile);
                setUploadLoading(false);
            }

            setSubmitLoading(true);
            await studentService.submitAssignment(submitModal._id, fileUrl);
            setSubmitModal(null);
            setSelectedFile(null);
            setFileName('');
            await fetchDashboard();
        } catch (err: unknown) {
            setUploadLoading(false);
            setSubmitMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Submission failed');
        } finally {
            setSubmitLoading(false);
            setUploadLoading(false);
        }
    };

    const getSubmitButton = (a: Assignment) => {
        if (a.mySubmission?.isReviewed) {
            return (
                <button className="btn btn-sm" style={{ background: '#10B981', color: 'white', border: 'none', cursor: 'default' }}>
                    <CheckCircle size={12} /> Reviewed
                </button>
            );
        }
        if (a.mySubmission) {
            if (a.canEdit) {
                return (
                    <button className="btn btn-sm btn-outline"
                        style={{ borderColor: '#10B981', color: '#10B981', background: '#F0FDF4' }}
                        onClick={() => { setSubmitModal(a); setSelectedFile(null); setFileName(''); setSubmitMsg(''); }}>
                        Edit Submission
                    </button>
                );
            }
            return (
                <button className="btn btn-sm" style={{ background: '#10B981', color: 'white', border: 'none', cursor: 'default' }}>
                    Submitted
                </button>
            );
        }
        return (
            <button className="btn btn-sm btn-outline"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'white' }}
                onClick={() => { setSubmitModal(a); setSelectedFile(null); setFileName(''); setSubmitMsg(''); }}>
                Submit
            </button>
        );
    };

    const renderDashboard = () => {
        if (!data) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;
        return (
            <>
                <div className="dashboard-grid-main">
                    {data.happeningNow ? (
                        <div className="happening-now">
                            <div className="happening-badge">Happening Now</div>
                            <h2>{data.happeningNow.courseId.name}</h2>
                            <div className="details">{data.happeningNow.facultyId.name} · {data.happeningNow.room}</div>
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
                            <div className="card-sub">Based on recorded sessions.</div>
                        </div>
                        <div className="card">
                            <div className="card-label">Pending Assignments</div>
                            <div className="card-value">{data.pendingAssignments?.length || 0}/{data.totalAssignments || 0}</div>
                            <div className="card-sub">Due soon.</div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="card">
                        <div className="card-header"><span className="card-title">Today's Time Table</span></div>
                        <div className="timetable-list">
                            {data.timetable.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No classes today</p>}
                            {data.timetable.map((t) => (
                                <div key={t._id} className="timetable-row">
                                    <div className="timetable-time">
                                        {t.startTime.split(':')[0]}:{t.startTime.split(':')[1]?.split(' ')[0]}<br />
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.startTime.includes('AM') ? 'AM' : 'PM'}</span>
                                    </div>
                                    <div className="timetable-subject">
                                        <div className="subject-name">{t.courseId.name}</div>
                                        <div className="subject-meta">{t.facultyId.name} · {t.room}</div>
                                    </div>
                                    {isClassActive(t.dayOfWeek, t.startTime, t.endTime) && t.isLive && (
                                        <button className="btn btn-sm btn-primary" onClick={() => alert('Joining Live Class...')}>
                                            Join Live Class
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Assignments Due</span>
                            <span className="view-all" onClick={() => setActiveTab('assignments')} style={{ cursor: 'pointer' }}>view all</span>
                        </div>
                        <div className="assignment-list">
                            {(data.pendingAssignments || []).slice(0, 4).map((a) => (
                                <div key={a._id} className="assignment-row">
                                    <div className="assignment-info">
                                        <div className="asgn-name">{a.title}</div>
                                        <div className="asgn-meta">
                                            <span className="badge badge-subject">{a.courseId.name}</span>
                                            <span className="due-text">Due : {getDaysUntil(a.dueDate)}</span>
                                        </div>
                                    </div>
                                    {getSubmitButton(a)}
                                </div>
                            ))}
                            {(!data.pendingAssignments || data.pendingAssignments.length === 0) && (
                                <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No pending assignments 🎉</p>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderTimetable = () => {
        if (!data) return null;
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return (
            <div className="card">
                <div className="card-header"><span className="card-title">Full Timetable — {data.student.branch} Branch</span></div>
                {days.map(day => {
                    const entries = data.timetable.filter(t => t.dayOfWeek === day);
                    if (entries.length === 0) return null;
                    return (
                        <div key={day} style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{day}</div>
                            <div className="timetable-list">
                                {entries.map(t => (
                                    <div key={t._id} className="timetable-row">
                                        <div className="timetable-time">{t.startTime}</div>
                                        <div className="timetable-subject">
                                            <div className="subject-name">{t.courseId.name} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({t.courseId.code})</span></div>
                                            <div className="subject-meta">{t.facultyId.name} · {t.room}</div>
                                        </div>
                                        {isClassActive(t.dayOfWeek, t.startTime, t.endTime) && t.isLive && (
                                            <button className="btn btn-sm btn-primary" onClick={() => alert('Joining Live Class...')}>
                                                Join Live Class
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {data.timetable.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '1rem 0' }}>No timetable entries for your branch yet. Contact admin.</p>}
            </div>
        );
    };

    const renderAssignments = () => {
        const pending = data?.pendingAssignments || [];
        const completed = data?.completedAssignments || [];
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                    <div className="card-header"><span className="card-title">Assignments Due ({pending.length})</span></div>
                    <div className="assignment-list">
                        {pending.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No pending assignments 🎉</p>}
                        {pending.map((a) => (
                            <div key={a._id} className="assignment-row">
                                <div className="assignment-info">
                                    <div className="asgn-name">{a.title}</div>
                                    <div className="asgn-meta">
                                        <span className="badge badge-subject">{a.courseId.name}</span>
                                        <span className="due-text">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                                        {a.description && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> · {a.description}</span>}
                                    </div>
                                </div>
                                {getSubmitButton(a)}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><span className="card-title">Completed / Reviewed ({completed.length})</span></div>
                    <div className="assignment-list">
                        {completed.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>No reviewed assignments yet.</p>}
                        {completed.map((a) => (
                            <div key={a._id} className="assignment-row">
                                <div className="assignment-info">
                                    <div className="asgn-name">{a.title}</div>
                                    <div className="asgn-meta">
                                        <span className="badge badge-subject">{a.courseId.name}</span>
                                        {a.mySubmission?.grade !== undefined && (
                                            <span style={{ marginLeft: '0.5rem', color: '#10B981', fontWeight: 600 }}>Grade: {a.mySubmission.grade}/100</span>
                                        )}
                                        {a.mySubmission?.feedback && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> · {a.mySubmission.feedback}</span>
                                        )}
                                    </div>
                                </div>
                                <button className="btn btn-sm" style={{ background: '#10B981', color: 'white', border: 'none', cursor: 'default' }}>
                                    <CheckCircle size={12} /> Reviewed
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-layout">
            <Sidebar role="student" activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="main-content">
                <div className="search-bar-wrap">
                    <div className="search-bar">
                        <Search size={16} color="#94a3b8" />
                        <input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                {activeTab === 'dashboard' && (
                    <div className="welcome-section">
                        <h1>Welcome back, {data?.student?.name || 'Student'} !</h1>
                        <p>Here's what's happening in your Timetable today.</p>
                    </div>
                )}
                {loading ? (
                    <div className="loading"><div className="spinner" /><span>Loading...</span></div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'timetable' && renderTimetable()}
                        {activeTab === 'assignments' && renderAssignments()}
                        {activeTab === 'settings' && <SettingsPage />}
                    </>
                )}
            </main>

            {/* Submit / Edit Assignment Modal */}
            {submitModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '2rem',
                        width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{submitModal.mySubmission ? 'Edit Submission' : 'Submit Assignment'}</h3>
                            <button onClick={() => setSubmitModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}><b>{submitModal.title}</b> · {submitModal.courseId.name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                            Due: {new Date(submitModal.dueDate).toLocaleDateString()}
                        </p>

                        {/* Show current submission if editing */}
                        {submitModal.mySubmission?.fileUrl && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#065F46' }}>
                                    ✓ Current submission:{' '}
                                    <a href={resolveFileUrl(submitModal.mySubmission.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: '#059669' }}>
                                        View file
                                    </a>
                                </p>
                            </div>
                        )}

                        {/* File upload area */}
                        <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem', cursor: 'pointer' }}
                            onClick={() => fileRef.current?.click()}>
                            <Upload size={24} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                                {fileName ? <><b style={{ color: '#10B981' }}>✓ {fileName}</b></> : (submitModal.mySubmission ? 'Click to replace with a new file' : 'Click to upload PDF or Image')}
                            </p>
                            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                        </div>

                        {submitMsg && (
                            <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{submitMsg}</p>
                        )}

                        <button
                            className="btn btn-primary btn-full"
                            disabled={(!selectedFile && !submitModal.mySubmission?.fileUrl) || uploadLoading || submitLoading}
                            onClick={handleSubmit}
                        >
                            {uploadLoading ? 'Uploading...' : submitLoading ? 'Submitting...' : 'Final Submit'}
                        </button>
                        <button className="btn btn-outline btn-full" style={{ marginTop: '0.5rem', borderColor: 'var(--border)' }}
                            onClick={() => setSubmitModal(null)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboardPage;
