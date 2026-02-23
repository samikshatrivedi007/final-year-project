import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authService } from '../services/services';

const roleLabels: Record<string, string> = {
    student: 'Student',
    faculty: 'Faculty',
    admin: 'College Admin',
    superadmin: 'Super Admin',
};

const COURSES = ['BTech', 'MTech', 'BPharma'];

interface BranchOption { _id: string; name: string; course: string }

const SignupPage: React.FC = () => {
    const { role = 'student' } = useParams<{ role: string }>();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '', password: '', confirmPassword: '',
        rollOrId: '', phone: '', name: '',
        course: '', branch: '', semester: 1, department: '',
    });
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [branchLoading, setBranchLoading] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Load branches dynamically when course is selected (students only)
    useEffect(() => {
        if (role !== 'student' || !form.course) {
            setBranches([]);
            setForm(f => ({ ...f, branch: '' }));
            return;
        }
        setBranchLoading(true);
        authService.getBranches(form.course)
            .then(data => setBranches(data))
            .catch(() => setBranches([]))
            .finally(() => setBranchLoading(false));
    }, [form.course, role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (role === 'student') {
            if (!form.rollOrId.trim()) { setError('Roll Number is required'); return; }
            if (!form.course) { setError('Course (degree) is required'); return; }
            if (!form.branch) { setError('Branch is required. Please select a course first.'); return; }
        }

        setLoading(true);
        try {
            await authService.register({
                username: form.username,
                password: form.password,
                rollOrId: form.rollOrId || form.name,
                phone: form.phone,
                role,
                name: form.name,
                ...(role === 'student' && { course: form.course, branch: form.branch, semester: form.semester }),
                ...(role === 'faculty' && { department: form.department }),
            });
            navigate(`/login/${role}`);
        } catch (err: unknown) {
            setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const isStudent = role === 'student';

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <h1>Already have an account?</h1>
                <p>Go back to login if you're already registered.</p>
                <div style={{ marginTop: '2rem' }}>
                    <Link to={`/login/${role}`}>
                        <button className="btn btn-outline">Login</button>
                    </Link>
                </div>
            </div>
            <div className="auth-right">
                <h2>Sign Up — {roleLabels[role]}</h2>
                <p className="subtitle">Fill in your details to register.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-group">
                        <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                        <input className="form-input" placeholder="Your full name" value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                    </div>

                    <div className="form-group">
                        <label>Username <span style={{ color: 'red' }}>*</span></label>
                        <input className="form-input" placeholder="Choose a unique username" value={form.username}
                            onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
                    </div>

                    {isStudent && (
                        <div className="form-group">
                            <label>Roll Number <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" placeholder="e.g. CS2021001 (unique)" value={form.rollOrId}
                                onChange={e => setForm(f => ({ ...f, rollOrId: e.target.value }))} required />
                        </div>
                    )}

                    {!isStudent && (
                        <div className="form-group">
                            <label>Employee ID / Admin ID <span style={{ color: 'red' }}>*</span></label>
                            <input className="form-input" placeholder="Unique employee ID" value={form.rollOrId}
                                onChange={e => setForm(f => ({ ...f, rollOrId: e.target.value }))} required />
                        </div>
                    )}

                    {role === 'faculty' && (
                        <div className="form-group">
                            <label>Department</label>
                            <input className="form-input" placeholder="e.g. Computer Science" value={form.department}
                                onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                        </div>
                    )}

                    {isStudent && (
                        <>
                            {/* Course (Degree) — mandatory for students */}
                            <div className="form-group">
                                <label>Course (Degree) <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={form.course}
                                    onChange={e => setForm(f => ({ ...f, course: e.target.value, branch: '' }))} required>
                                    <option value="">Select Course</option>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Branch — loads dynamically after course is selected */}
                            <div className="form-group">
                                <label>Branch <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={form.branch}
                                    onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                                    disabled={!form.course || branchLoading} required>
                                    <option value="">
                                        {!form.course ? 'Select a Course first' : branchLoading ? 'Loading branches...' : branches.length === 0 ? 'No branches available — contact admin' : 'Select Branch'}
                                    </option>
                                    {branches.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                </select>
                                {form.course && branches.length === 0 && !branchLoading && (
                                    <p style={{ color: '#F59E0B', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                                        ⚠ No branches configured for {form.course}. Ask admin to add branches.
                                    </p>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Semester <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={form.semester}
                                    onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))} required>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Phone</label>
                        <input className="form-input" placeholder="+91 9876543210" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>

                    <div className="form-group">
                        <label>Password <span style={{ color: 'red' }}>*</span></label>
                        <input type="password" className="form-input" placeholder="••••••••" value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                    </div>

                    <div className="form-group">
                        <label>Confirm Password <span style={{ color: 'red' }}>*</span></label>
                        <input type="password" className="form-input" placeholder="••••••••" value={form.confirmPassword}
                            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                    <div className="auth-switch">
                        <Link to="/">← Back to role selection</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
