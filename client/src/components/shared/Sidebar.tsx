import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, BookOpen, Settings, LogOut, GraduationCap, Users, CalendarDays, BookMarked, ShieldCheck } from 'lucide-react';

interface SidebarProps {
    role: 'student' | 'faculty' | 'admin';
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const navByRole: Record<string, { key: string; label: string; icon: React.ComponentType<{ size?: number }> }[]> = {
    student: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'timetable', label: 'Time table', icon: Calendar },
        { key: 'assignments', label: 'Assignments', icon: BookOpen },
        { key: 'settings', label: 'Setting', icon: Settings },
    ],
    faculty: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'schedule', label: 'Schedule', icon: Calendar },
        { key: 'assignments', label: 'Assignments', icon: BookOpen },
        { key: 'settings', label: 'Setting', icon: Settings },
    ],
    admin: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'timetable', label: 'Timetable', icon: CalendarDays },
        { key: 'teacherSchedule', label: 'Teacher Schedule', icon: Calendar },
        { key: 'branches', label: 'Branches (Degree)', icon: BookMarked },
        { key: 'courses', label: 'Subjects (Courses)', icon: BookOpen },
        { key: 'students', label: 'Students', icon: GraduationCap },
        { key: 'faculty', label: 'Faculty', icon: Users },
        { key: 'settings', label: 'Setting', icon: Settings },
    ],
};

// Extra tabs only for superadmin
const superAdminExtra = [
    { key: 'admins', label: 'Admins', icon: ShieldCheck },
];

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange }) => {
    const navigate = useNavigate();
    const { state, logout } = useAuth();
    const isSuperAdmin = state.user?.role === 'superadmin';
    const baseItems = navByRole[role] || navByRole.student;
    // Insert superadmin extra tabs before Settings
    const navItems = isSuperAdmin
        ? [...baseItems.slice(0, -1), ...superAdminExtra, baseItems[baseItems.length - 1]]
        : baseItems;
    const initials = (state.user?.username || 'U').substring(0, 2).toUpperCase();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <GraduationCap size={22} />
                <span>SC<b style={{ color: 'var(--primary)' }}>MS</b></span>
            </div>
            <nav className="sidebar-nav">
                {navItems.map(({ key, label, icon: Icon }) => (
                    <button key={key} className={`sidebar-link ${activeTab === key ? 'active' : ''}`} onClick={() => onTabChange(key)}>
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </nav>
            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <div className="avatar">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="name">{state.user?.username || 'User'}</div>
                        <div className="role">{isSuperAdmin ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}</div>
                    </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
