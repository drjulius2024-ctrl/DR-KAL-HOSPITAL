import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useVitals } from '@/lib/hooks/useClinicalData';
// @ts-ignore
import { analyzeResult, analyzeBP } from '@/lib/medical_analysis';

interface VitalsMonitorProps {
    patient: {
        id: string;
        name: string;
        age?: string | number;
        sex?: string;
        gender?: string;
        vitals?: {
            hr?: string | number;
            spo2?: string | number;
            bp?: string;
            temp?: string | number;
            rr?: string | number;
        };
    } | null;
    minimal?: boolean;
}

export default function VitalsMonitor({ patient, minimal = false }: VitalsMonitorProps) {
    if (!patient) return <div className="p-4 text-center text-gray-500">Select a patient to view vitals.</div>;

    // Fetch real historical vitals
    const { vitals: history, latestVital, isLoading } = useVitals(patient.id);

    // Use latest from API if available, otherwise fall back to prop
    const hr = latestVital?.hr || patient.vitals?.hr || 72;
    const spo2 = latestVital?.spo2 || patient.vitals?.spo2 || '98%';
    const bp = latestVital?.bp || patient.vitals?.bp;
    const temp = latestVital?.temp || patient.vitals?.temp;
    const rr = latestVital?.rr || patient.vitals?.rr;

    // Parse numeric for animation speed
    const hrNum = parseInt(String(hr)) || 72;

    // Analysis Helper
    const getStatusColor = (type: string, val: any) => {
        if (!val) return 'text-white';
        const age = patient.age ? parseInt(String(patient.age)) : 30;
        const sex = patient.sex || patient.gender || 'Male';

        let analysis: any = null;
        if (type === 'BP') analysis = analyzeBP(val, age);
        else analysis = analyzeResult('VITALS', type, val, age, sex);

        if (!analysis || analysis.flag === 'Normal') {
            // Default colors if normal
            if (type === 'HR') return 'text-neon-green';
            if (type === 'SpO2') return 'text-neon-blue';
            if (type === 'BP') return 'text-yellow-400';
            return 'text-white';
        }

        return analysis.color === 'red' ? 'text-red-500 font-bold' : (analysis.color === 'orange' ? 'text-orange-400 font-bold' : 'text-white');
    };

    // Process history for charts
    // Reverse to show oldest to newest (assuming API returns desc)
    const sortedHistory = [...history].reverse();

    const weightData = sortedHistory
        .filter(v => v.weight)
        .slice(-7) // Last 7 entries
        .map(v => ({
            day: v.date.split('/').slice(0, 2).join('/'), // Concise date
            val: parseFloat(v.weight)
        }));

    const glucoseData = sortedHistory
        .filter(v => v.glucose)
        .slice(-7)
        .map(v => ({
            time: v.time,
            val: parseFloat(v.glucose)
        }));

    // Fallbacks if no data
    const displayWeight = weightData.length > 0 ? weightData : [{ day: 'No Data', val: 0 }];
    const displayGlucose = glucoseData.length > 0 ? glucoseData : [{ time: 'No Data', val: 0 }];

    return (
        <Card className="vitals-monitor-card">
            <div className={`vitals-header ${minimal ? 'minimal' : ''}`}>
                <h3>Real-time Vitals Monitoring</h3>
                <Button variant="secondary" size="small">📡 Connect Wearable</Button>
            </div>

            <div className={`ekg-container ${minimal ? 'minimal' : ''}`}>
                <div className="ekg-label">EKG MONITORING - {patient.name}</div>
                {/* EKG Animation */}
                <div className="ekg-line"></div>
                <svg width="100%" height="100%" viewBox="0 0 800 200" className="ekg-svg">
                    <path d="M0,100 L50,100 L60,80 L70,120 L80,100 L130,100 L140,20 L150,180 L160,100 L210,100 L220,80 L230,120 L240,100 L290,100 L300,20 L310,180 L320,100"
                        fill="none"
                        stroke="#00ff00"
                        strokeWidth="2"
                        strokeDasharray="1000"
                        strokeDashoffset="0">
                        <animate attributeName="stroke-dashoffset" from="1000" to="0" dur={`${60 / hrNum * 5}s`} repeatCount="indefinite" />
                    </path>
                </svg>

                <div className="vitals-readout">
                    <div className="vitals-readout-item">
                        <div className={`vitals-readout-value ${getStatusColor('HR', hr)}`}>{hr}</div>
                        <div className="text-white text-xs">HR</div>
                    </div>
                    <div className="vitals-readout-item">
                        <div className={`vitals-readout-value ${getStatusColor('SpO2', spo2)}`}>{spo2}%</div>
                        <div className="text-white text-xs">SpO2</div>
                    </div>
                    {bp && (
                        <div className="vitals-readout-item">
                            <div className={`vitals-readout-value text-val-xl ${getStatusColor('BP', bp)}`}>{bp}</div>
                            <div className="text-white text-xs">BP</div>
                        </div>
                    )}
                    {temp && (
                        <div className="vitals-readout-item">
                            <div className={`vitals-readout-value ${getStatusColor('Temp', temp)}`}>{temp}°</div>
                            <div className="text-white text-xs">Temp</div>
                        </div>
                    )}
                    {rr && (
                        <div className="vitals-readout-item">
                            <div className={`vitals-readout-value ${getStatusColor('RR', rr)}`}>{rr}</div>
                            <div className="text-white text-xs">RR</div>
                        </div>
                    )}
                </div>
            </div>

            {!minimal && (
                <div className="trends-grid">
                    <div className="trend-card">
                        <div className="trend-label">Weight Trend (Recent)</div>
                        <div className="trend-chart trend-chart-block">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayWeight}>
                                    <XAxis dataKey="day" stroke="#666" fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="val" fill="var(--color-primary-800)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="trend-card">
                        <div className="trend-label">Glucose Trend (Recent)</div>
                        <div className="trend-chart trend-chart-block">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={displayGlucose}>
                                    <XAxis dataKey="time" stroke="#666" fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="val" fill="var(--color-primary-400)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
