import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/services';
import type { User } from '../types';
import { LogIn } from 'lucide-react';

const roleLabels: Record<string, string> = {
    student: 'Student Portal',
    faculty: 'Faculty Portal',
    admin: 'College Admin',
    superadmin: 'Super Admin',
};

const LoginPage: React.FC = () => {
    const { role = 'student' } = useParams<{ role: string }>();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [form, setForm] = useState({ rollOrId: '', username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await authService.login({ rollOrId: form.rollOrId, username: form.username, password: form.password });
            if (data.role !== role) { setError(`This account is not a ${roleLabels[role]}. Please go back and select the correct role.`); setLoading(false); return; }
            const user: User = { id: '', username: data.username, role: data.role, rollOrId: data.rollOrId };
            login(user, data.token);
            const redirects: Record<string, string> = { student: '/student/dashboard', faculty: '/faculty/dashboard', admin: '/admin/dashboard', superadmin: '/admin/dashboard' };
            navigate(redirects[data.role] || '/');
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <h1>Sign Up Yourself.</h1>
                <p>In case you haven't registered yourself you can Sign Up.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to={`/signup/${role}`}>
                        <button className="btn btn-outline">Sign Up</button>
                    </Link>
                </div>
            </div>
            <div className="auth-right">
                <h2>Login Yourself</h2>
                <p className="subtitle">Fill the details. <span style={{ color: '#64748b' }}>({roleLabels[role]})</span></p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="error-msg">{error}</div>}
                    <div className="form-group">
                        <label>Roll No. or ID No.</label>
                        <input className="form-input" placeholder="e.g. CS2021001" value={form.rollOrId} onChange={e => setForm(f => ({ ...f, rollOrId: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input className="form-input" placeholder="Your username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : <><LogIn size={16} /> Login</>}
                    </button>
                    <div className="auth-switch">
                        <Link to="/">← Back to role selection</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
