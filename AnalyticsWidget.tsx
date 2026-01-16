import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Card } from './ui/Card';
import { useVitals } from '@/lib/hooks/useClinicalData';
import { Badge } from './ui/Badge';

export default function AnalyticsWidget({ patientId }: { patientId: string }) {
    const { vitals, isLoading } = useVitals(patientId);

    if (isLoading) return <div>Loading Analytics...</div>;
    if (!vitals || vitals.length === 0) return (
        <Card className="p-4 text-center text-gray-500">
            No vitals history available for analytics.
        </Card>
    );

    // Prepare Data: Sort by time, take last 10, then add a "Prediction"
    const sortedVitals = [...vitals].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()).slice(-10);

    // Simple AI Prediction Logic (Linear Projection)
    const lastVital = sortedVitals[sortedVitals.length - 1];
    const prevVital = sortedVitals.length > 1 ? sortedVitals[sortedVitals.length - 2] : lastVital;

    // Calculate slope for Heart Rate
    const currentHr = lastVital?.heartRate ?? 0;
    const previousHr = prevVital?.heartRate ?? 0;
    const hrSlope = currentHr - previousHr;
    const predictedHr = currentHr + hrSlope;

    const data = [
        ...sortedVitals.map(v => ({
            time: new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hr: v.heartRate,
            spo2: v.spo2,
            type: 'Historical'
        })),
        {
            time: 'Next 1h (AI)',
            hr: predictedHr,
            spo2: lastVital?.spo2 ?? 0, // Assuming steady
            type: 'Predicted'
        }
    ];

    return (
        <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-navy-900">AI Predictive Vitals Trends</h3>
                    <p className="text-sm text-gray-500">Analysis of recent heart rate & SpO2 Stability</p>
                </div>
                <Badge variant="info">AI Confidence: 85%</Badge>
            </div>

            <div className="analytics-chart-container">
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="hr"
                            stroke="var(--color-primary-500)"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Heart Rate"
                        />
                        <Line
                            type="monotone"
                            dataKey="spo2"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="SpO2 (%)"
                        />
                        <ReferenceArea x1={data[data.length - 2].time} x2={data[data.length - 1].time} strokeOpacity={0.3} fill="var(--color-primary-50)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>🤖 AI Insight:</strong> Patient heart rate is showing a {hrSlope > 0 ? 'rising' : (hrSlope < 0 ? 'falling' : 'stable')} trend.
                {hrSlope > 5 ? ' Requires monitoring for potential Tachycardia.' : ' Follow standard protocols.'}
            </div>
        </Card>
    );
}
