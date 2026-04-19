import React from 'react';

type BadgeType = 'Internship' | 'Job' | 'Training' | 'Applied' | 'Viewed' | 'Rejected' | 'Cleared' | string;

interface StatusBadgeProps {
    type: BadgeType;
    style?: React.CSSProperties;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, style = {} }) => {
    let color = 'var(--text-muted)';

    switch (type) {
        case 'Internship': color = '#3B82F6'; break;
        case 'Job': color = '#10B981'; break;
        case 'Training': color = '#F59E0B'; break;
        case 'Applied': color = '#6366f1'; break;
        case 'Viewed': color = '#f59e0b'; break;
        case 'Cleared': color = '#10b981'; break;
        case 'Rejected': color = '#dc2626'; break;
        default: break;
    }

    return (
        <span
            className="badge"
            style={{
                background: color + '20',
                color: color,
                ...style
            }}
        >
            {type}
        </span>
    );
};

export default StatusBadge;
