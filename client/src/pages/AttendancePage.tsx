import React, { useEffect, useState } from 'react';
import { studentService } from '../services/services';
import ChartCard from '../components/shared/ChartCard';

interface AttendanceSummary {
    _id: string;
    subjectId: { _id: string; name: string; code: string };
    totalClasses: number;
    attendedClasses: number;
    medicalLeaves: number;
    events: number;
}

const AttendancePage: React.FC = () => {
    const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const data = await studentService.getAttendanceSummary();
                setAttendanceData(data);
            } catch (err) {
                console.error("Failed to fetch attendance summary", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, []);

    if (loading) return <div className="loading"><div className="spinner" /><span>Loading...</span></div>;

    const chartData = attendanceData.map(d => {
        const percentage = d.totalClasses > 0 ? (d.attendedClasses / d.totalClasses) * 100 : 0;
        return {
            subject: d.subjectId?.name || 'Unknown',
            percentage: parseFloat(percentage.toFixed(2)),
            total: d.totalClasses,
            attended: d.attendedClasses,
        };
    });

    const getColorForEntry = (entry: any) => {
        if (entry.percentage < 75) return '#DC2626';
        if (entry.percentage <= 85) return '#FBBF24';
        return '#10B981';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', height: '100%' }}>
            <h2>Attendance Overview</h2>

            <ChartCard
                title="Subject-wise Attendance"
                data={chartData}
                dataKeyX="subject"
                dataKeyY="percentage"
                fillColors={getColorForEntry}
            />

            <div className="dashboard-grid">
                {attendanceData.map(d => {
                    const percentage = d.totalClasses > 0 ? (d.attendedClasses / d.totalClasses) * 100 : 0;
                    return (
                        <div key={d._id} className="card" style={{ borderLeft: `4px solid ${getColorForEntry({ percentage })}` }}>
                            <h3>{d.subjectId?.name}</h3>
                            <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>Code: {d.subjectId?.code}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Classes</span>
                                    <div style={{ fontWeight: 'bold' }}>{d.totalClasses}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attended</span>
                                    <div style={{ fontWeight: 'bold' }}>{d.attendedClasses}</div>
                                </div>
                                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Overall Percentage</span>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: getColorForEntry({ percentage }) }}>
                                        {percentage.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {attendanceData.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No attendance records found.</p>}
            </div>
        </div>
    );
};

export default AttendancePage;
