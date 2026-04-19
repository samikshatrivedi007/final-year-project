import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface ChartCardProps {
    title: string;
    data: any[];
    dataKeyX: string;
    dataKeyY: string;
    yDomain?: [number, number];
    fillColors?: string | ((entry: any) => string);
}

const ChartCard: React.FC<ChartCardProps> = ({ title, data, dataKeyX, dataKeyY, yDomain = [0, 100], fillColors = '#8884d8' }) => {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
            <div style={{ flexGrow: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey={dataKeyX} />
                        <YAxis domain={yDomain} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey={dataKeyY} fill={typeof fillColors === 'string' ? fillColors : undefined} name="Value">
                            {typeof fillColors === 'function' && data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={fillColors(entry)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartCard;
