import React, { useEffect, useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import { adminService } from '../services/services';
import { Search, Users, GraduationCap, BarChart3, UserPlus, Trash2, Pencil } from 'lucide-react';

interface AdminDashData {
    totalStudents: number;
    totalFaculty: number;
    attendanceRate: number;
    recentStudents: { username: string; rollOrId: string; createdAt: string }[];
    recentFaculty: { username: string; rollOrId: string; createdAt: string }[];
}

const MOCK: AdminDashData = {
    totalStudents: 342,
    totalFaculty: 28,
    attendanceRate: 87,
    recentStudents: [
        { username: 'Akash Sharma', rollOrId: 'CS2024001', createdAt: new Date().toISOString() },
        { username: 'Priya Patel', rollOrId: 'CS2024002', createdAt: new Date().toISOString() },
        { username: 'Rahul Mehra', rollOrId: 'CS2024003', createdAt: new Date(Date.now() - 86400000).toISOString() },
    ],
    recentFaculty: [
        { username: 'Dr. Brown', rollOrId: 'FAC2024001', createdAt: new Date().toISOString() },
        { username: 'Ms. Frizzle', rollOrId: 'FAC2024002', createdAt: new Date().toISOString() },
    ],
};

const AdminDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState<AdminDashData>(MOCK);
    const [search, setSearch] = useState('');

    useEffect(() => {
        adminService.getDashboard()
            .then(d => setData(d))
            .catch(() => setData(MOCK));
    }, []);

    const renderDashboard = () => (
        <>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#EFF6FF' }}><Users size={22} color="#2563EB" /></div>
                    <div className="stat-value">{data.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#F0FDF4' }}><GraduationCap size={22} color="#10B981" /></div>
                    <div className="stat-value">{data.totalFaculty}</div>
                    <div className="stat-label">Total Faculty</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#FFFBEB' }}><BarChart3 size={22} color="#F59E0B" /></div>
                    <div className="stat-value">{data.attendanceRate}%</div>
                    <div className="stat-label">Attendance Rate</div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><span className="card-title">Recent Student Registrations</span></div>
                    {data.recentStudents.map((s, i) => (
                        <div key={i} className="activity-item">
                            <div className="activity-dot" />
                            <div className="activity-text"><b>{s.username}</b> — {s.rollOrId}</div>
                            <div className="activity-time">{new Date(s.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
                <div className="card">
                    <div className="card-header"><span className="card-title">Recent Faculty Registrations</span></div>
                    {data.recentFaculty.map((f, i) => (
                        <div key={i} className="activity-item">
                            <div className="activity-dot" style={{ background: '#10B981' }} />
                            <div className="activity-text"><b>{f.username}</b> — {f.rollOrId}</div>
                            <div className="activity-time">{new Date(f.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderStudents = () => (
        <div className="card">
            <div className="card-header">
                <span className="card-title">Manage Students</span>
                <button className="btn btn-primary btn-sm"><UserPlus size={14} /> Add Student</button>
            </div>
            <table className="manage-table">
                <thead>
                    <tr><th>Name</th><th>Roll / ID</th><th>Registered</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {data.recentStudents.map((s, i) => (
                        <tr key={i}>
                            <td><b>{s.username}</b></td>
                            <td>{s.rollOrId}</td>
                            <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'white' }}><Pencil size={12} /></button>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}><Trash2 size={12} /></button>
                            </td>
                        </tr>
                    ))}
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
                <thead>
                    <tr><th>Name</th><th>Employee ID</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    {data.recentFaculty.map((f, i) => (
                        <tr key={i}>
                            <td><b>{f.username}</b></td>
                            <td>{f.rollOrId}</td>
                            <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--primary)', background: 'white' }}><Pencil size={12} /></button>
                                <button className="btn btn-sm btn-outline" style={{ borderColor: '#FECACA', color: 'var(--danger)', background: '#FEF2F2' }}><Trash2 size={12} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderSettings = () => <div className="card"><div className="card-header"><span className="card-title">Settings</span></div><p style={{ color: 'var(--text-muted)' }}>System settings coming soon.</p></div>;

    const tabContent: Record<string, () => React.ReactElement> = { dashboard: renderDashboard, students: renderStudents, faculty: renderFaculty, settings: renderSettings };

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
                        <h1>Admin Dashboard</h1>
                        <p>Overview of the Smart College Management System.</p>
                    </div>
                )}
                {(tabContent[activeTab] || renderDashboard)()}
            </main>
        </div>
    );
};

export default AdminDashboardPage;
