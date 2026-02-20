import React, { useEffect, useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { facultyService } from '../services/services';
import type { FacultyDashboardData, TimetableEntry, Assignment } from '../types';
import { Search } from 'lucide-react';

const MOCK: FacultyDashboardData = {
    faculty: { name: 'Teacher', employeeId: 'FAC001', department: 'Mathematics' },
    totalSubmissions: 7,
    happeningNow: {
        _id: '1', courseId: { _id: 'c1', name: 'Advance Mathematics', code: 'MAT301' },
        facultyId: { _id: 'f1', name: 'Dr. Brown' }, dayOfWeek: 'Monday',
        startTime: '10:00 AM', endTime: '11:00 AM', room: 'Room 101', isLive: true, lectureNumber: 5
    },
    schedule: [
        { _id: 's1', courseId: { _id: 'c1', name: 'Quadratic Equations', code: 'MAT201' }, facultyId: { _id: 'f1', name: '' }, dayOfWeek: 'Monday', startTime: '09:00 AM', endTime: '10:00 AM', room: 'Room 102', isLive: false, lectureNumber: 1 },
        { _id: 's2', courseId: { _id: 'c2', name: 'Advance Mathematics', code: 'MAT301' }, facultyId: { _id: 'f1', name: '' }, dayOfWeek: 'Monday', startTime: '10:00 AM', endTime: '11:00 AM', room: 'Room 101', isLive: true, lectureNumber: 5 },
        { _id: 's3', courseId: { _id: 'c3', name: 'Calculus', code: 'MAT401' }, facultyId: { _id: 'f1', name: '' }, dayOfWeek: 'Monday', startTime: '11:00 AM', endTime: '12:00 PM', room: 'Room 105', isLive: false, lectureNumber: 3 },
        { _id: 's4', courseId: { _id: 'c4', name: 'Quadratic Equations', code: 'MAT201' }, facultyId: { _id: 'f1', name: '' }, dayOfWeek: 'Monday', startTime: '01:00 PM', endTime: '02:00 PM', room: 'Room 102', isLive: false, lectureNumber: 2 },
    ],
    assignments: [
        { _id: 'a1', courseId: { _id: 'c1', name: 'Quadratic' }, title: 'Quadratic', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [{ studentId: 'Akash', submittedAt: '' }] },
        { _id: 'a2', courseId: { _id: 'c2', name: 'Advance Maths' }, title: 'Advance Maths', description: '', dueDate: new Date(Date.now() + 86400000).toISOString(), submissions: [{ studentId: 'Sonia', submittedAt: '' }] },
        { _id: 'a3', courseId: { _id: 'c3', name: 'Calculas' }, title: 'Calculas', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [{ studentId: 'Hrithik', submittedAt: '' }] },
        { _id: 'a4', courseId: { _id: 'c4', name: 'Quadratic' }, title: 'Quadratic', description: '', dueDate: new Date(Date.now() + 2 * 86400000).toISOString(), submissions: [{ studentId: 'Prity', submittedAt: '' }] },
    ],
};

const reviewNames = ['Akash', 'Sonia', 'Hrithik', 'Prity'];

const FacultyDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<FacultyDashboardData>(MOCK);
    const [search, setSearch] = useState('');

    useEffect(() => {
        facultyService.getDashboard()
            .then(d => setData(d))
            .catch(() => setData(MOCK));
    }, []);

    const renderDashboard = () => (
        <>
            <div className="dashboard-grid-main">
                {data.happeningNow ? (
                    <div className="happening-now">
                        <div className="happening-badge">Happening Now</div>
                        <h2>{data.happeningNow.courseId.name}</h2>
                        <div className="details">{data.happeningNow.room}</div>
                        <div className="progress-wrap">
                            <div className="progress-bar"><div className="progress-fill" style={{ width: '62%' }} /></div>
                            <span className="progress-label">45 min left</span>
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
                        <div className="card-value">88%</div>
                    </div>
                    <div className="card">
                        <div className="card-label">Total Assignment Submissions</div>
                        <div className="card-value">{data.totalSubmissions}/10</div>
                        <div className="card-sub">3 Due for reviewed.</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><span className="card-title">Today's Schedule</span></div>
                    <div className="timetable-list">
                        {data.schedule.map((t: TimetableEntry, i) => (
                            <div key={t._id} className="timetable-row">
                                <div className="timetable-time">{t.startTime.split(':')[0]}:{t.startTime.split(':')[1].split(' ')[0]}<br /><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{t.startTime.includes('AM') ? 'AM' : 'PM'}</span></div>
                                <div className="timetable-subject">
                                    <div className="subject-name">{t.courseId.name}</div>
                                    <div className="subject-meta">Lecture:-{i + 1} · {t.room}</div>
                                </div>
                                {t.isLive
                                    ? <span className="badge badge-live">Live</span>
                                    : <span className="badge badge-live-outline">Live</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Review Assignments</span>
                        <span className="view-all">view all</span>
                    </div>
                    <div className="assignment-list">
                        {data.assignments.map((a: Assignment, i) => (
                            <div key={a._id} className="assignment-row">
                                <div className="assignment-info">
                                    <div className="asgn-name">{reviewNames[i] || 'Student'}</div>
                                    <div className="asgn-meta">
                                        <span className="badge badge-subject">{a.courseId.name}</span>
                                        <span className="due-text">Due : {i === 1 ? '1 day' : '2 days'}</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'white' }}>Review</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    const renderSchedule = () => (
        <div className="card">
            <div className="card-header"><span className="card-title">Full Schedule</span></div>
            <div className="timetable-list">
                {data.schedule.map((t: TimetableEntry, i) => (
                    <div key={t._id} className="timetable-row">
                        <div className="timetable-time">{t.startTime}</div>
                        <div className="timetable-subject">
                            <div className="subject-name">{t.courseId.name}</div>
                            <div className="subject-meta">{t.dayOfWeek} · Lecture {i + 1} · {t.room}</div>
                        </div>
                        {t.isLive ? <span className="badge badge-live">Live</span> : <span className="badge badge-live-outline">Start Live</span>}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAssignments = () => (
        <div className="card">
            <div className="card-header"><span className="card-title">All Assignments</span></div>
            <div className="assignment-list">
                {data.assignments.map((a: Assignment, i) => (
                    <div key={a._id} className="assignment-row">
                        <div className="assignment-info">
                            <div className="asgn-name">{reviewNames[i] || 'Student'} — {a.title}</div>
                            <div className="asgn-meta">
                                <span className="badge badge-subject">{a.courseId.name}</span>
                                <span className="due-text">Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <button className="btn btn-sm btn-primary">Review</button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => <div className="card"><div className="card-header"><span className="card-title">Settings</span></div><p style={{ color: 'var(--text-muted)' }}>Profile settings coming soon.</p></div>;

    const tabContent: Record<string, () => React.ReactElement> = { dashboard: renderDashboard, schedule: renderSchedule, assignments: renderAssignments, settings: renderSettings };

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
                        <h1>Welcome back, Teacher !</h1>
                        <p>Here's what's happening in your schedule today.</p>
                    </div>
                )}
                {(tabContent[activeTab] || renderDashboard)()}
            </main>
        </div>
    );
};

export default FacultyDashboardPage;
