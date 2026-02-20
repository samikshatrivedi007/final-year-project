import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, MonitorPlay, Shield, Crown } from 'lucide-react';

const roles = [
    { key: 'student', label: 'Student Portal', desc: 'Access classes, timetable, and attendance', icon: GraduationCap },
    { key: 'faculty', label: 'Faculty Portal', desc: 'Manage Classes, Schedule, and Notice', icon: MonitorPlay },
    { key: 'admin', label: 'College Admin', desc: 'Manage staff and students', icon: Shield },
    { key: 'superadmin', label: 'Super Admin', desc: 'Configuration and Oversight', icon: Crown },
];

const RolePage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = useAuth();

    const handleRole = (roleKey: string) => {
        setRole(roleKey);
        navigate(`/login/${roleKey}`);
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <h1>Manage your college with confidence.</h1>
                <p>The all in one platform for students, teachers, and admin. Streamline your educational journey today.</p>
            </div>
            <div className="auth-right">
                <h2>Welcome back</h2>
                <p className="subtitle">Select your role to sign in to the portal.</p>
                <div className="role-cards">
                    {roles.map(({ key, label, desc, icon: Icon }) => (
                        <div key={key} className="role-card" onClick={() => handleRole(key)}>
                            <div className="role-icon"><Icon size={20} /></div>
                            <div className="role-card-info">
                                <h3>{label}</h3>
                                <p>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RolePage;
