export const CLINICAL_MODULES = {
    DOCTOR: [
        {
            id: 'prescription',
            name: 'Digital Prescription',
            icon: '💊',
            parameters: [
                { id: 'drug', label: 'Drug Name', default: '' },
                { id: 'dosage', label: 'Dosage (e.g. 500mg)', default: '' },
                { id: 'frequency', label: 'Frequency (e.g. 1-0-1)', default: '' },
                { id: 'duration', label: 'Duration (days)', default: '5' },
                { id: 'instruction', label: 'Special Instructions', type: 'textarea', default: '' }
            ]
        },
        {
            id: 'checkup',
            name: 'Checkup Report',
            icon: '📋',
            parameters: [
                { id: 'complaint', label: 'Chief Complaint', type: 'textarea', default: '' },
                { id: 'findings', label: 'Clinical Findings', type: 'textarea', default: '' },
                { id: 'diagnosis', label: 'Diagnosis', default: '' },
                { id: 'plan', label: 'Treatment Plan', type: 'textarea', default: '' }
            ]
        },
        {
            id: 'referral',
            name: 'Internal Referral',
            icon: '🔄',
            parameters: [
                { id: 'department', label: 'Refer to Department', default: '' },
                { id: 'reason', label: 'Reason for Referral', type: 'textarea', default: '' }
            ]
        }
    ],
    NURSE: [
        {
            id: 'vitals',
            name: 'Vital Signs',
            icon: '💓',
            parameters: [
                { id: 'bp', label: 'Blood Pressure', unit: 'mmHg', default: '120/80' },
                { id: 'temp', label: 'Temperature', unit: '°C', default: '36.5' },
                { id: 'hr', label: 'Heart Rate', unit: 'bpm', default: '72' },
                { id: 'spo2', label: 'SPO2', unit: '%', default: '98' },
                { id: 'weight', label: 'Weight', unit: 'kg', default: '' }
            ]
        },
        {
            id: 'triage',
            name: 'Triage Notes',
            icon: '🚦',
            parameters: [
                { id: 'priority', label: 'Priority Level', default: 'Green' },
                { id: 'summary', label: 'Triage Summary', type: 'textarea', default: '' }
            ]
        },
        {
            id: 'immunization',
            name: 'Immunization Log',
            icon: '💉',
            parameters: [
                { id: 'vaccine', label: 'Vaccine Name', default: '' },
                { id: 'dose', label: 'Dose', default: '' },
                { id: 'site', label: 'Administration Site', default: 'Left Arm' }
            ]
        }
    ],
    PHARMACIST: [
        {
            id: 'dispensing',
            name: 'Dispense Meds',
            icon: '💊',
            parameters: [
                { id: 'drug', label: 'Medication Name', default: '' },
                { id: 'batch', label: 'Batch No.', default: '' },
                { id: 'quantity', label: 'Quantity Dispensed', default: '' },
                { id: 'counseling', label: 'Counseling Notes', type: 'textarea', default: '' }
            ]
        },
        {
            id: 'inventory',
            name: 'Inventory Sync',
            icon: '📦',
            parameters: [
                { id: 'item', label: 'Stock Item', default: '' },
                { id: 'action', label: 'Action (Add/Remove)', default: 'Add' },
                { id: 'amount', label: 'Amount', default: '0' }
            ]
        },
        {
            id: 'verification',
            name: 'Audit Check',
            icon: '🛡️',
            parameters: [
                { id: 'rxId', label: 'Prescription ID', default: '' },
                { id: 'finding', label: 'Audit Findings', type: 'textarea', default: 'Verified' }
            ]
        }
    ]
};
