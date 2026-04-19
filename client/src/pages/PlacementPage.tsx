import React, { useEffect, useState } from 'react';
import { studentService } from '../services/services';
import OpportunityCard from '../components/shared/OpportunityCard';
import StatusBadge from '../components/shared/StatusBadge';

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
    opportunityId: Opportunity;
    status: 'Applied' | 'Viewed' | 'Rejected' | 'Cleared';
    appliedAt: string;
}

const PlacementPage: React.FC = () => {
    const [viewMode, setViewMode] = useState<'opportunities' | 'applications'>('opportunities');
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewMode === 'opportunities') {
                const ops = await studentService.getOpportunities();
                setOpportunities(ops);
            } else {
                const apps = await studentService.getApplications();
                setApplications(apps);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const handleApply = async (opportunityId: string) => {
        try {
            await studentService.applyOpportunity(opportunityId);
            alert('Applied successfully!');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to apply');
        }
    };

    if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Training & Placement</h2>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <button
                        className={`btn btn-sm ${viewMode === 'opportunities' ? 'btn-primary' : ''}`}
                        onClick={() => setViewMode('opportunities')}
                        style={{ background: viewMode === 'opportunities' ? '' : 'transparent', color: viewMode === 'opportunities' ? '' : 'var(--text)', border: 'none' }}
                    >
                        Opportunities
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === 'applications' ? 'btn-primary' : ''}`}
                        onClick={() => setViewMode('applications')}
                        style={{ background: viewMode === 'applications' ? '' : 'transparent', color: viewMode === 'applications' ? '' : 'var(--text)', border: 'none' }}
                    >
                        Status
                    </button>
                </div>
            </div>

            {viewMode === 'opportunities' ? (
                <div className="dashboard-grid">
                    {opportunities.map(op => (
                        <OpportunityCard key={op._id} opportunity={op} onApply={handleApply} />
                    ))}
                    {opportunities.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No upcoming opportunities right now.</p>}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {applications.map(app => (
                        <div key={app._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>{app.opportunityId?.company || 'Unknown Company'}</h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <span>Role: {app.opportunityId?.title}</span>
                                    <span>Applied on: {new Date(app.appliedAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div>
                                <StatusBadge type={app.status} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                    ))}
                    {applications.length === 0 && <p style={{ color: 'var(--text-muted)' }}>You haven't applied to any opportunities yet.</p>}
                </div>
            )}
        </div>
    );
};

export default PlacementPage;
