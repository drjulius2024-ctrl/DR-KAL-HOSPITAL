export type RiskLevel = 'CRITICAL' | 'URGENT' | 'STABLE' | 'NORMAL';

export interface TriageResult {
    score: number; // 1-10 scale
    level: RiskLevel;
    reason: string;
    color: string; // Hex code for UI badge
}

interface Vitals {
    bloodPressure?: string; // "120/80"
    heartRate?: number | string;
    spo2?: number | string;
    temperature?: number | string;
}

export function assessPatientRisk(vitals: Vitals): TriageResult {
    let score = 0;
    let reasons: string[] = [];

    // Default
    if (!vitals) {
        return { score: 0, level: 'NORMAL', reason: 'No vitals data', color: '#10b981' };
    }

    // 1. Analyze Blood Pressure
    if (vitals.bloodPressure) {
        const [systolic, diastolic] = vitals.bloodPressure.split('/').map(n => parseInt(n));
        if (systolic >= 180 || diastolic >= 120) {
            score += 5;
            reasons.push('Hypertensive Crisis');
        } else if (systolic >= 140 || diastolic >= 90) {
            score += 2;
            reasons.push('High BP');
        } else if (systolic < 90 || diastolic < 60) {
            score += 3;
            reasons.push('Hypotension');
        }
    }

    // 2. Analyze Heart Rate
    const hr = typeof vitals.heartRate === 'string' ? parseInt(vitals.heartRate) : vitals.heartRate;
    if (hr) {
        if (hr > 120) {
            score += 3;
            reasons.push('Tachycardia');
        } else if (hr < 50) {
            score += 2;
            reasons.push('Bradycardia');
        }
    }

    // 3. Analyze Oxygen Saturation
    const spo2 = typeof vitals.spo2 === 'string' ? parseInt(vitals.spo2 as string) : vitals.spo2;
    if (spo2) {
        if (spo2 < 90) {
            score += 5;
            reasons.push('Hypoxia (Critical)');
        } else if (spo2 < 95) {
            score += 2;
            reasons.push('Low Oxygen');
        }
    }

    // 4. Analyze Temperature
    const temp = typeof vitals.temperature === 'string' ? parseFloat(vitals.temperature as string) : vitals.temperature;
    if (temp) {
        if (temp > 39) {
            score += 3;
            reasons.push('High Fever');
        } else if (temp < 35) {
            score += 3;
            reasons.push('Hypothermia');
        }
    }

    // Determine Level and Color based on Score
    let level: RiskLevel = 'NORMAL';
    let color = '#10b981'; // Green

    if (score >= 5) {
        level = 'CRITICAL';
        color = '#ef4444'; // Red
    } else if (score >= 3) {
        level = 'URGENT';
        color = '#f59e0b'; // Amber
    } else if (score >= 1) {
        level = 'STABLE';
        color = '#3b82f6'; // Blue
    }

    return {
        score: score,
        level: level,
        reason: reasons.length > 0 ? reasons.join(', ') : 'Vitals within normal range',
        color: color
    };
}
