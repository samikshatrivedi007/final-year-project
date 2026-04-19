import React, { useEffect, useState } from 'react';
import { adminService } from '../services/services';
import StatusBadge from '../components/shared/StatusBadge';
import { Plus, X } from 'lucide-react';

interface Opportunity {
    _id: string;
    company: string;
    title: string;
    type: 'Internship' | 'Job' | 'Training';
    deadline: string;
    eligibility: string;
    description: string;
}

interface Application {
    _id: string;
    studentId: { _id: string; name: string; rollNo: string; course: string; branch: string; };
    opportunityId: { _id: string; company: string; title: string; type: string; };
    status: 'Applied' | 'Viewed' | 'Rejected' | 'Cleared';
    appliedAt: string;
}

const AdminPlacementPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'opportunities' | 'applications'>('opportunities');
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [formMsg, setFormMsg] = useState('');
    const [formData, setFormData] = useState({
        company: '', title: '', type: 'Internship', deadline: '', description: '', eligibility: ''
    });

    const fetchOpportunities = async () => {
        try {
            const data = (await adminService.getOpportunities?.() || await fetch('/api/opportunities', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json())); // fallback
            // Wait, actually studentService has getOpportunities, but adminService uses the same routes...
            setOpportunities(data);
        } catch { /* ignore */ }
    };

    const fetchApplications = async () => {
        try {
            const data = await adminService.getApplications();
            setApplications(data);
        } catch { /* ignore */ }
    };

    const fetchData = async () => {
        setLoading(true);
        if (viewMode === 'opportunities') {
            await fetchOpportunities();
        } else {
            await fetchApplications();
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const handleCreateOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminService.createOpportunity(formData);
            setFormData({ company: '', title: '', type: 'Internship', deadline: '', description: '', eligibility: '' });
            setShowForm(false);
            fetchOpportunities();
        } catch (err: any) {
            setFormMsg(err.response?.data?.error || 'Failed to create opportunity');
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await adminService.updateApplicationStatus(id, status);
            fetchApplications();
        } catch {
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button className={`btn btn-sm ${viewMode === 'opportunities' ? 'btn-primary' : ''}`} onClick={() => setViewMode('opportunities')} style={{ background: viewMode === 'opportunities' ? '' : 'transparent', color: viewMode === 'opportunities' ? '' : 'var(--text)', border: 'none' }}>Opportunities</button>
                    <button className={`btn btn-sm ${viewMode === 'applications' ? 'btn-primary' : ''}`} onClick={() => setViewMode('applications')} style={{ background: viewMode === 'applications' ? '' : 'transparent', color: viewMode === 'applications' ? '' : 'var(--text)', border: 'none' }}>Student Applications</button>
                </div>
                {viewMode === 'opportunities' && (
                    <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setShowForm(true)}>
                        <Plus size={14} /> Add Opportunity
                    </button>
                )}
            </div>

            {viewMode === 'opportunities' ? (
                <div className="card">
                    <div className="card-header"><span className="card-title">Manage Opportunities</span></div>
                    <table className="manage-table">
                        <thead><tr><th>Company</th><th>Role</th><th>Type</th><th>Deadline</th><th>Eligibility</th></tr></thead>
                        <tbody>
                            {opportunities.map(op => (
                                <tr key={op._id}>
                                    <td><b>{op.company}</b></td>
                                    <td>{op.title}</td>
                                    <td><StatusBadge type={op.type} /></td>
                                    <td>{new Date(op.deadline).toLocaleDateString()}</td>
                                    <td>{op.eligibility}</td>
                                </tr>
                            ))}
                            {opportunities.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No opportunities created yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header"><span className="card-title">Student Applications</span></div>
                    <table className="manage-table">
                        <thead><tr><th>Student</th><th>Branch & Course</th><th>Opportunity</th><th>Date Applied</th><th>Status</th></tr></thead>
                        <tbody>
                            {applications.map(app => (
                                <tr key={app._id}>
                                    <td><b>{app.studentId?.name || 'Unknown'}</b> ({app.studentId?.rollNo})</td>
                                    <td>{app.studentId?.branch} ({app.studentId?.course})</td>
                                    <td>{app.opportunityId?.company} - {app.opportunityId?.title}</td>
                                    <td>{new Date(app.appliedAt || Date.now()).toLocaleDateString()}</td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <select
                                            className="form-input"
                                            style={{ fontWeight: 600, padding: '0.2rem 0.5rem', width: 'auto', minWidth: '110px' }}
                                            value={app.status}
                                            onChange={e => handleUpdateStatus(app._id, e.target.value)}
                                        >
                                            <option value="Applied">Applied</option>
                                            <option value="Viewed">Viewed</option>
                                            <option value="Cleared">Cleared</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {applications.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No applications found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Opportunity Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Add Opportunity</h3>
                            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        {formMsg && <p style={{ color: '#DC2626', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{formMsg}</p>}
                        <form onSubmit={handleCreateOpportunity} className="auth-form">
                            <div className="form-group">
                                <label>Company Name <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. Google" value={formData.company} onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Role <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. Software Engineer Intern" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Type <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={formData.type} onChange={e => setFormData(f => ({ ...f, type: e.target.value as any }))} required>
                                    <option value="Internship">Internship</option>
                                    <option value="Job">Job</option>
                                    <option value="Training">Training</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Deadline <span style={{ color: 'red' }}>*</span></label>
                                <input type="date" className="form-input" value={formData.deadline} onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Eligibility <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" placeholder="e.g. BTech CSE > 75%" value={formData.eligibility} onChange={e => setFormData(f => ({ ...f, eligibility: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label>Description <span style={{ color: 'red' }}>*</span></label>
                                <textarea className="form-input" placeholder="Job details..." value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} required style={{ minHeight: '80px', resize: 'vertical' }} />
                            </div>

                            <button type="submit" className="btn btn-primary btn-full">
                                Create Opportunity
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPlacementPage;
