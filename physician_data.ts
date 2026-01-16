export interface PhysicianTab {
    id: string;
    name: string;
    icon: string;
}

export const PHYSICIAN_TABS: PhysicianTab[] = [
    { id: 'smart-list', name: 'Smart Patient List', icon: '📋' },
    { id: 'charthub', name: 'ChartHub', icon: '📂' },
    { id: 'patient-records', name: 'Patient Records', icon: '🗂️' },
    { id: 'telehealth', name: 'Telehealth & Remote', icon: '📞' },
    { id: 'action-center', name: 'Action Center', icon: '📋' },
    { id: 'analytics', name: 'Analytics & Insights', icon: '📊' },
    { id: 'communication', name: 'Communication Hub', icon: '📨' },
    { id: 'collaboration', name: 'Collaboration', icon: '👨‍⚕️' },
    { id: 'tasks', name: 'Tasks & Follow-Ups', icon: '⏰' },
    { id: 'engagement', name: 'Patient Engagement', icon: '📱' },
    { id: 'alerts', name: 'Alerts 🔔', icon: '🔔' }
];

interface MockPatient {
    id: string;
    name: string;
    age: number;
    gender: string;
    acuity: string;
    alerts: string[];
    vitals: {
        bp: string;
        hr: string;
        temp: string;
        spo2: string;
    };
    recentLabs: { [key: string]: string };
    activeIssues: string[];
    meds: string[];
    allergies: string[];
    history: string;
    carePlan: string;
}

export const MOCK_PATIENTS: MockPatient[] = [
    {
        id: 'PATH-1234',
        name: 'John Doe',
        age: 45,
        gender: 'Male',
        acuity: 'High',
        alerts: ['Tachycardia', 'Low SpO2'],
        vitals: { bp: '145/95', hr: '102', temp: '38.2', spo2: '92%' },
        recentLabs: { glucose: '140 mg/dL', crp: '15 mg/L' },
        activeIssues: ['Acute Respiratory Distress', 'Hypertension'],
        meds: ['Lisinopril 10mg', 'Albuterol PRN'],
        allergies: ['Penicillin'],
        history: 'Former smoker, Type 2 Diabetes',
        carePlan: 'High-flow oxygen, IV fluids, monitor vital signs every 15 mins.'
    },
    {
        id: 'PATH-5678',
        name: 'Jane Smith',
        age: 32,
        gender: 'Female',
        acuity: 'Low',
        alerts: [],
        vitals: { bp: '120/80', hr: '68', temp: '36.8', spo2: '99%' },
        recentLabs: { hba1c: '5.8%', iron: 'normal' },
        activeIssues: ['Routine Pregnancy Follow-up'],
        meds: ['Prenatal Vitamins'],
        allergies: [],
        history: 'No significant history',
        carePlan: 'Continue vitamins, schedule next ultrasound.'
    },
    {
        id: 'PATH-9901',
        name: 'Robert Brown',
        age: 67,
        gender: 'Male',
        acuity: 'Medium',
        alerts: ['Pending Lab Results'],
        vitals: { bp: '135/85', hr: '75', temp: '37.0', spo2: '96%' },
        recentLabs: { creatinine: '1.4 mg/dL' },
        activeIssues: ['Chronic Kidney Disease Stage 3'],
        meds: ['Amlodipine 5mg', 'Metformin 500mg'],
        allergies: ['Sulfa drugs'],
        history: 'CKD, Heart Failure',
        carePlan: 'Renal diet, monitor creatinine monthly.'
    }
];

interface AISuggestionsData {
    [key: string]: {
        diagnoses: string[];
        alerts: string[];
        recommendations: string[];
    };
}

export const AI_SUGGESTIONS: AISuggestionsData = {
    'PATH-1234': {
        diagnoses: ['Pneumonia', 'Heart Failure Exacerbation'],
        alerts: ['Potential Albuterol interaction with high heart rate'],
        recommendations: ['Order Chest X-Ray', 'Procalcitonin level', 'Start Ceftriaxone']
    }
};

export interface ClinicalAlert {
    type: 'critical' | 'reminder';
    message: string;
    time: string;
}

export const CLINICAL_ALERTS: ClinicalAlert[] = [
    { type: 'critical', message: 'Critical potassium result for PATH-9901: 6.2 mEq/L', time: '10 mins ago' },
    { type: 'reminder', message: 'Follow-up appointment for PATH-5678 in 2 days', time: '1 hour ago' }
];
