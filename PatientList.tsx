import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface Patient {
    id: string;
    name: string;
    pathNumber?: string;
    status?: string;
    acuity?: string;
    room?: string;
    age?: string | number;
    gender?: string;
    vitals?: {
        bloodPressure?: string;
        heartRate?: string | number;
        spO2?: string | number;
        temperature?: string | number;
    };
    alerts?: string[];
    triage?: {
        level: 'CRITICAL' | 'URGENT' | 'STABLE' | 'NORMAL';
        score: number;
        reason: string;
    };
}

interface PatientListProps {
    patients: Patient[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function PatientList({ patients, selectedId, onSelect }: PatientListProps) {
    if (!patients || patients.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h4>No patients found</h4>
            </div>
        );
    }

    const getBadgeVariant = (triage?: Patient['triage'], status?: string, acuity?: string) => {
        if (triage) {
            if (triage.level === 'CRITICAL') return 'error';
            if (triage.level === 'URGENT') return 'warning';
            if (triage.level === 'STABLE') return 'info';
            return 'success';
        }
        if (status === 'Critical' || acuity === 'High') return 'error';
        if (status === 'Observation' || acuity === 'Medium') return 'warning';
        if (status === 'Stable' || acuity === 'Low') return 'success';
        return 'neutral';
    };

    return (
        <div className="patient-grid">
            {patients.map(patient => (
                <Card
                    key={patient.id}
                    className={`patient-card ${selectedId === patient.id ? 'selected' : ''}`}
                    onClick={() => onSelect(patient.id)}
                >
                    <div className="patient-header">
                        <div className="patient-profile">
                            <div className="patient-avatar">
                                {patient.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="patient-name">{patient.name}</h4>
                                <div className="patient-id">{patient.pathNumber || patient.id}</div>
                            </div>
                        </div>
                        <Badge variant={getBadgeVariant(patient.triage, patient.status, patient.acuity)}>
                            {patient.triage ? `${patient.triage.level} (${patient.triage.score})` : (patient.status || patient.acuity || 'Stable')}
                        </Badge>
                    </div>

                    <div className="patient-info-grid">
                        <div>📍 {patient.room || 'N/A'}</div>
                        <div>🎂 {patient.age} yrs</div>
                        <div>⚧ {patient.gender}</div>
                    </div>

                    <div className="vitals-row">
                        <div className="vitals-item">
                            <div className="vitals-label">BP</div>
                            <div className="vitals-value">{patient.vitals?.bp || '--/--'}</div>
                        </div>
                        <div className="vitals-divider"></div>
                        <div className="vitals-item">
                            <div className="vitals-label">HR</div>
                            <div className="vitals-value text-error">{patient.vitals?.hr || '--'} <span className="text-unit">bpm</span></div>
                        </div>
                        <div className="vitals-divider"></div>
                        <div className="vitals-item">
                            <div className="vitals-label">SpO2</div>
                            <div className="vitals-value text-info">{patient.vitals?.spo2 || '--'}%</div>
                        </div>
                    </div>

                    {(patient.alerts && patient.alerts.length > 0) && (
                        <div className="alert-row">
                            {patient.alerts.map((alert, i) => (
                                <Badge key={i} variant="error">
                                    ⚠️ {alert}
                                </Badge>
                            ))}
                        </div>
                    )}
                </Card>
            ))}
        </div>
    );
}
