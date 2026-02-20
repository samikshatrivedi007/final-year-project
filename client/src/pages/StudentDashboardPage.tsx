import React, { useEffect, useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { studentService } from '../services/services';
import type { StudentDashboardData, TimetableEntry, Assignment } from '../types';
import { Search } from 'lucide-react';

const MOCK: StudentDashboardData = {
    student: { name: 'Student', rollNo: 'CS001', semester: 3, branch: 'Computer Science' },
    attendanceRate: 88,
    happeningNow: {
        _id: '1', courseId: { _id: 'c1', name: 'Physics II', code: 'PHY201' },
        facultyId: { _id: 'f1', name: 'Dr. Brown' }, dayOfWeek: 'Monday',
        startTime: '10:00 AM', endTime: '11:00 AM', room: 'Lab 3', isLive: true, lectureNumber: 5
    },
    timetable: [
        { _id: 't1', courseId: { _id: 'c1', name: 'Advance Mathematics', code: 'MAT301' }, facultyId: { _id: 'f1', name: 'Ms. Frizzle' }, dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'Room 101', isLive: false, lectureNumber: 1 },
        { _id: 't2', courseId: { _id: 'c2', name: 'Advance Mathematics', code: 'MAT302' }, facultyId: { _id: 'f1', name: 'Ms. Frizzle' }, dayOfWeek: 'Monday', startTime: '10:00 AM', endTime: '11:00 AM', room: 'Room 101', isLive: true, lectureNumber: 2 },
        { _id: 't3', courseId: { _id: 'c3', name: 'Advance Mathematics', code: 'MAT303' }, facultyId: { _id: 'f1', name: 'Ms. Frizzle' }, dayOfWeek: 'Monday', startTime: '11:00 AM', endTime: '12:00 PM', room: 'Room 101', isLive: false, lectureNumber: 3 },
        { _id: 't4', courseId: { _id: 'c4', name: 'Advance Mathematics', code: 'MAT304' }, facultyId: { _id: 'f1', name: 'Ms. Frizzle' }, dayOfWeek: 'Monday', startTime: '12:00 PM', endTime: '01:00 PM', room: 'Room 101', isLive: false, lectureNumber: 4 },
    ],
    pendingAssignments: [
        { _id: 'a1', courseId: { _id: 'c1', name: 'Mathematics' }, title: 'Advance Mathematics', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [] },
        { _id: 'a2', courseId: { _id: 'c2', name: 'Physics' }, title: 'Physics Lab: Gravity', description: '', dueDate: new Date(Date.now() + 86400000).toISOString(), submissions: [] },
        { _id: 'a3', courseId: { _id: 'c3', name: 'Mechanical' }, title: 'Quantum Mechanics', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [] },
        { _id: 'a4', courseId: { _id: 'c4', name: 'Chemistry' }, title: 'Thermostats', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [] },
    ],
};

const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    return days === 1 ? '1 day' : `${days} days`;
};

const StudentDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<StudentDashboardData>(MOCK);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        studentService.getDashboard()
            .then(d => setData(d))
            .catch(() => setData(MOCK))
            .finally(() => setLoading(false));
    }, []);

    const progress = 62; // simulated remaining time %

    const renderDashboard = () => (
        <>
            <div className="dashboard-grid-main">
                {/* Happening Now */}
                {data.happeningNow ? (
                    <div className="happening-now">
                        <div className="happening-badge">Happening Now</div>
                        <h2>{data.happeningNow.courseId.name}</h2>
                        <div className="details">{data.happeningNow.facultyId.name} · {data.happeningNow.room}</div>
                        <div className="progress-wrap">
                            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                            <span className="progress-label">45 min left</span>
                        </div>
                    </div>
                ) : (
                    <div className="happening-now" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>No live class right now</div>
                    </div>
                )}

                {/* Right stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card">
                        <div className="card-label">Overall Attendance</div>
                        <div className="card-value">{data.attendanceRate}%</div>
                        <div className="card-sub">You have missed 2 classes last week.</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Pending Assignments</div>
                        <div className="card-value">{data.pendingAssignments.length}</div>
                        <div className="card-sub">Due in next 48 hours.</div>
                    </div>
                </div>
            </div>

            {/* Bottom grid */}
            <div className="dashboard-grid">
                {/* Timetable */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Today's Time Table</span>
                    </div>
                    <div className="timetable-list">
                        {data.timetable.map((t: TimetableEntry) => (
                            <div key={t._id} className="timetable-row">
                                <div className="timetable-time">{t.startTime.split(':')[0]}:{t.startTime.split(':')[1].split(' ')[0]}<br /><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.startTime.includes('AM') ? 'AM' : 'PM'}</span></div>
                                <div className="timetable-subject">
                                    <div className="subject-name">{t.courseId.name}</div>
                                    <div className="subject-meta">{t.facultyId.name} · {t.room}</div>
                                </div>
                                {t.isLive && <span className="badge badge-live">Live</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Assignments Due */}
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Assignments Due</span>
                        <span className="view-all">view all</span>
                    </div>
                    <div className="assignment-list">
                        {data.pendingAssignments.map((a: Assignment) => (
                            <div key={a._id} className="assignment-row">
                                <div className="assignment-info">
                                    <div className="asgn-name">{a.title}</div>
                                    <div className="asgn-meta">
                                        <span className="badge badge-subject">{a.courseId.name}</span>
                                        <span className="due-text">Due : {getDaysUntil(a.dueDate)}</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'white' }}>Submit</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    const renderTimetable = () => (
        <div className="card">
            <div className="card-header"><span className="card-title">Full Timetable</span></div>
            <div className="timetable-list">
                {data.timetable.map((t: TimetableEntry) => (
                    <div key={t._id} className="timetable-row">
                        <div className="timetable-time">{t.startTime}</div>
                        <div className="timetable-subject">
                            <div className="subject-name">{t.courseId.name} <span style={{ fontWeight: 400, color: '#94a3b8' }}>({t.courseId.code})</span></div>
                            <div className="subject-meta">{t.dayOfWeek} · {t.facultyId.name} · {t.room}</div>
                        </div>
                        {t.isLive && <span className="badge badge-live">Live</span>}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAssignments = () => (
        <div className="card">
            <div className="card-header"><span className="card-title">All Assignments</span></div>
            <div className="assignment-list">
                {data.pendingAssignments.map((a: Assignment) => (
                    <div key={a._id} className="assignment-row">
                        <div className="assignment-info">
                            <div className="asgn-name">{a.title}</div>
                            <div className="asgn-meta">
                                <span className="badge badge-subject">{a.courseId.name}</span>
                                <span className="due-text">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button className="btn btn-sm btn-primary">Submit</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="card"><div className="card-header"><span className="card-title">Settings</span></div><p style={{ color: 'var(--text-muted)' }}>Profile and notification settings coming soon.</p></div>
    );

    const tabContent: Record<string, () => React.ReactElement> = { dashboard: renderDashboard, timetable: renderTimetable, assignments: renderAssignments, settings: renderSettings };

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
                        <h1>Welcome back, Student !</h1>
                        <p>Here's what's happening in your Timetable today.</p>
                    </div>
                )}
                {loading ? (
                    <div className="loading"><div className="spinner" /><span>Loading...</span></div>
                ) : (
                    (tabContent[activeTab] || renderDashboard)()
                )}
            </main>
        </div>
    );
};

export default StudentDashboardPage;
