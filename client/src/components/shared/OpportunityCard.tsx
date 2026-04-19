import React from 'react';
import StatusBadge from './StatusBadge';

interface OpportunityCardProps {
    opportunity: {
        _id: string;
        company: string;
        title: string;
        type: 'Internship' | 'Job' | 'Training';
        deadline: string;
        eligibility: string;
        description: string;
    };
    onApply?: (id: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onApply }) => {
    const isPastDeadline = new Date(opportunity.deadline) < new Date();

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>{opportunity.company}</h3>
                    <h4 style={{ margin: '0.25rem 0', color: 'var(--text-muted)', fontWeight: 'normal' }}>{opportunity.title}</h4>
                </div>
                <StatusBadge type={opportunity.type} />
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', flexGrow: 1 }}>{opportunity.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg)', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Eligibility</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{opportunity.eligibility}</span>
                </div>
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Deadline</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isPastDeadline ? '#dc2626' : 'inherit' }}>
                        {new Date(opportunity.deadline).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {onApply && (
                <button
                    className="btn btn-primary w-full"
                    onClick={() => onApply(opportunity._id)}
                    disabled={isPastDeadline}
                >
                    {isPastDeadline ? 'Closed' : 'Apply Now'}
                </button>
            )}
        </div>
    );
};

export default OpportunityCard;
