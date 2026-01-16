export const PHARMACY_TABS = [
    { id: 'inbox', name: 'Smart Inbox', icon: '📬' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
    { id: 'patients', name: 'Patient Profiles', icon: '👤' },
    { id: 'patient-records', name: 'Patient Records', icon: '🗂️' },
    { id: 'telepharmacy', name: 'Telepharmacy Hub', icon: '📞' },
    { id: 'collaboration', name: 'Collaboration', icon: '👨‍⚕️' },
    { id: 'support', name: 'AI Support', icon: '🤖' },
    { id: 'compliance', name: 'Compliance & Insights', icon: '📊' },
    { id: 'integrations', name: 'Integrations', icon: '🔄' },
    { id: 'communication', name: 'Communication Hub', icon: '📨' },
    { id: 'action-center', name: 'Action Center', icon: '📋' },
    { id: 'engagement', name: 'Patient Engagement', icon: '📱' },
    { id: 'alerts', name: 'Alerts 🔔', icon: '🔔' }
];

export const MOCK_PHARMACY_DATA = {
    prescriptions: [
        {
            id: 'RX-7781',
            patientId: 'PATH-1234',
            patientName: 'John Doe',
            drug: 'Lisinopril',
            dosage: '10mg',
            urgency: 'High',
            status: 'Pending',
            issue: '🚨 Interaction Alert',
            alerts: ['Potential Albuterol interaction (Severe)'],
            time: '12:45 PM',
            insuranceStatus: 'Verified',
            refillsRemaining: 2,
            adherence: 'Poor (65%)',
            history: ['Aug 2024: 10mg - Dispensed', 'Sep 2024: 10mg - Dispensed']
        },
        {
            id: 'RX-9902',
            patientId: 'PATH-5678',
            patientName: 'Jane Smith',
            drug: 'Prenatal Vitamins',
            dosage: 'Once Daily',
            urgency: 'Medium',
            status: 'Ready for Pickup',
            issue: '✅ Clear',
            alerts: [],
            time: '01:30 PM',
            insuranceStatus: 'Pending Approval',
            refillsRemaining: 5,
            adherence: 'Excellent (100%)',
            history: ['Jul 2024: 30 count - Dispensed']
        },
        {
            id: 'RX-1123',
            patientId: 'PATH-9901',
            patientName: 'Robert Brown',
            drug: 'Metformin',
            dosage: '500mg',
            urgency: 'High',
            status: 'Refill Overdue',
            issue: '📈 Adherence Issue',
            alerts: ['Patient missed last 3 refill cycles'],
            time: 'Yesterday',
            insuranceStatus: 'Verified',
            refillsRemaining: 0,
            adherence: 'Moderate (75%)',
            history: ['May 2024: 500mg - Dispensed', 'June 2024: 500mg - Dispensed']
        },
        {
            id: 'RX-1124',
            patientId: 'PATH-1234',
            patientName: 'John Doe',
            drug: 'Albuterol',
            dosage: '2 Puffs PRN',
            urgency: 'High',
            status: 'Pending',
            issue: '🚨 Interaction Alert',
            alerts: ['Potential Lisinopril interaction'],
            time: '12:50 PM',
            insuranceStatus: 'Verified',
            refillsRemaining: 1,
            adherence: 'High (90%)',
            history: []
        }
    ],
    inventory: [
        { id: 'inv-1', name: 'Lisinopril 10mg', quantity: 120, unit: 'tabs', batch: 'B123-X', expiry: '2025-05-12', status: 'Stable', reorderPoint: 50, location: 'Shelf A-4' },
        { id: 'inv-2', name: 'Metformin 500mg', quantity: 30, unit: 'tabs', batch: 'M990-Z', expiry: '2024-11-20', status: 'Low Stock', reorderPoint: 40, location: 'Shelf B-2' },
        { id: 'inv-3', name: 'Amoxicillin 250mg', quantity: 0, unit: 'caps', batch: 'A441-Y', expiry: '2025-01-05', status: 'Out of Stock', reorderPoint: 20, location: 'Ref-1' },
        { id: 'inv-4', name: 'Paracetamol 500mg', quantity: 1500, unit: 'tabs', batch: 'P001-A', expiry: '2026-08-30', status: 'Stable', reorderPoint: 200, location: 'Shelf C-1' }
    ],
    analytics: {
        avgAdherence: 84.5,
        dispensedToday: 42,
        pendingSyncs: 12,
        adherenceTrend: [
            { month: 'Jan', rate: 82 },
            { month: 'Feb', rate: 85 },
            { month: 'Mar', rate: 83 },
            { month: 'Apr', rate: 88 }
        ]
    }
};
