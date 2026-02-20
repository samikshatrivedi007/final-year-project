import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';
import type { User } from '../types';
import { UserPlus } from 'lucide-react';

const roleLabels: Record<string, string> = {
    student: 'Student Portal',
    faculty: 'Faculty Portal',
    admin: 'College Admin',
    superadmin: 'Super Admin',
};

const SignupPage: React.FC = () => {
    const { role = 'student' } = useParams<{ role: string }>();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ username: '', rollOrId: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authService.register({ ...form, role });
            const user: User = { id: '', username: data.username, role: data.role, rollOrId: data.rollOrId };
            login(user, data.token);
            const redirects: Record<string, string> = { student: '/student/dashboard', faculty: '/faculty/dashboard', admin: '/admin/dashboard', superadmin: '/admin/dashboard' };
            navigate(redirects[data.role] || '/');
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-right" style={{ background: 'white' }}>
                <h2>SignUp Yourself</h2>
                <p className="subtitle">Fill the details. <span style={{ color: '#64748b' }}>({roleLabels[role]})</span></p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="error-msg">{error}</div>}
                    <div className="form-group">
                        <label>Username</label>
                        <input className="form-input" placeholder="Full name or username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Roll No. or ID No.</label>
                        <input className="form-input" placeholder="e.g. CS2021001" value={form.rollOrId} onChange={e => setForm(f => ({ ...f, rollOrId: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Phone No.</label>
                        <input className="form-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Registering...' : <><UserPlus size={16} /> Sign Up</>}
                    </button>
                    <div className="auth-switch">
                        Already registered? <Link to={`/login/${role}`}><a>Login</a></Link>
                    </div>
                </form>
            </div>
            <div className="auth-left" style={{ order: 2 }}>
                <h1>Login Yourself.</h1>
                <p>In case you already registered yourself you can Login.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to={`/login/${role}`}>
                        <button className="btn btn-outline">Login</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
