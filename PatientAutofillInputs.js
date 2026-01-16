import React, { useState, useEffect } from 'react';
import { usePatients } from '@/lib/hooks/useClinicalData';

export default function PatientAutofillInputs({
    patientName,
    setPatientName,
    patientId,
    setPatientId,
    onSelect
}) {
    // We fetch patients here to suggest from. 
    // In a larger app, we might debounce this or pass it from parent.
    const { patients: realPatients = [] } = usePatients(patientName || patientId);

    const handleNameChange = (e) => {
        const val = e.target.value;
        setPatientName(val);

        // Auto-fill ID if exact name match found
        const found = realPatients.find(p => p.name.toLowerCase() === val.toLowerCase());
        if (found) {
            if (setPatientId) setPatientId(found.pathNumber || found.id);
            if (onSelect) onSelect(found);
        }
    };

    const handleIdChange = (e) => {
        const val = e.target.value;
        setPatientId(val);

        // Auto-fill Name if exact ID match found
        const found = realPatients.find(p => p.pathNumber === val || p.id === val);
        if (found) {
            if (setPatientName) setPatientName(found.name);
            if (onSelect) onSelect(found);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>Patient Name</label>
                <input
                    type="text"
                    className="input"
                    placeholder="Type to search..."
                    value={patientName}
                    onChange={handleNameChange}
                    list="autofill-patient-names"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <datalist id="autofill-patient-names">
                    {realPatients.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
            </div>
            <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>Patient ID</label>
                <input
                    type="text"
                    className="input"
                    placeholder="PATH-XXXX"
                    value={patientId}
                    onChange={handleIdChange}
                    list="autofill-patient-ids"
                    style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <datalist id="autofill-patient-ids">
                    {realPatients.map(p => <option key={p.id} value={p.pathNumber || p.id} />)}
                </datalist>
            </div>
        </div>
    );
}
