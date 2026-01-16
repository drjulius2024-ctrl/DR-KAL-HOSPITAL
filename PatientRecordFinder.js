"use client";
import { useState } from 'react';
import { getGlobalData, KEYS, logAudit } from '@/lib/global_sync';

export default function PatientRecordFinder({ title = "Patient Records Finder", description = "Search for patients by Path Number to view their complete medical history.", onRecordView, user, patients }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [previewFile, setPreviewFile] = useState(null);

    // Get all records
    const allRecords = getGlobalData(KEYS.RECORDS, []);

    // Filter records if a valid patients list is provided
    const records = patients && patients.length > 0
        ? allRecords.filter(r => patients.some(p => (p.pathNumber === r.pathNumber) || (p.id === r.pathNumber) || (p.name === r.patientName)))
        : allRecords;

    const handleViewRecord = (record) => {
        setPreviewFile(record);
        if (onRecordView) onRecordView(record);

        if (user) {
            logAudit({
                actorId: user.id,
                actorName: user.name,
                action: 'viewed_document',
                targetId: record.id,
                targetName: record.fileName,
                location: 'PatientRecordFinder',
                notes: `Viewed document for patient ${record.pathNumber}`
            });
        }
    };

    return (
        <>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2>{title}</h2>
                        <p style={{ color: '#666' }}>{description}</p>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '2rem', background: '#f8f9fa' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="🔍 Enter Path Number (e.g. PATH-1234)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && searchQuery) {
                                    const target = searchQuery.toUpperCase();
                                    setSelectedPatient(target);
                                    if (user) {
                                        logAudit({
                                            actorId: user.id,
                                            actorName: user.name,
                                            action: 'accessed_folder',
                                            targetId: target,
                                            targetName: 'Patient Folder',
                                            location: 'PatientRecordFinder'
                                        });
                                    }
                                }
                            }}
                            style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button
                            onClick={() => {
                                if (!searchQuery) return;
                                const target = searchQuery.toUpperCase();
                                setSelectedPatient(target);
                                if (user) {
                                    logAudit({
                                        actorId: user.id,
                                        actorName: user.name,
                                        action: 'accessed_folder',
                                        targetId: target,
                                        targetName: 'Patient Folder',
                                        location: 'PatientRecordFinder'
                                    });
                                }
                            }}
                            className="btn btn-primary"
                        >
                            Find Patient Folder
                        </button>
                    </div>
                </div>

                {selectedPatient ? (
                    <div className="card" style={{ borderTop: '4px solid var(--color-sea-blue)', animation: 'fadeIn 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>📁 Patient Folder: {selectedPatient}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Complete Medical Records & History</p>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Close Folder</button>
                        </div>

                        {(() => {
                            // Fuzzy matching for Path Number
                            const patientRecords = records.filter(r =>
                                (r.pathNumber || '').toUpperCase().includes(selectedPatient) ||
                                selectedPatient.includes((r.pathNumber || '').toUpperCase())
                            );

                            if (patientRecords.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '8px', border: '1px dashed #ccc' }}>
                                        <p style={{ color: '#999' }}>No medical records found for patient ID: <strong>{selectedPatient}</strong></p>
                                        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>Records will appear here once professionals dispatch lab results, clinical notes, or observations.</p>
                                    </div>
                                );
                            }

                            return (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: '#f8f9fa' }}>
                                                <th style={{ padding: '1rem' }}>Record Type</th>
                                                <th style={{ padding: '1rem' }}>Source Unit/Role</th>
                                                <th style={{ padding: '1rem' }}>Date & Time</th>
                                                <th style={{ padding: '1rem' }}>Issued By</th>
                                                <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {patientRecords.map(record => (
                                                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <strong>{record.fileName}</strong>
                                                        {record.professionalRole && <div style={{ fontSize: '0.7rem', color: '#888' }}>{record.professionalRole} RECORD</div>}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className="badge" style={{ background: record.professionalRole ? '#f0f0f0' : '#e6f7ff', color: record.professionalRole ? '#333' : '#0050b3' }}>
                                                            {record.unit}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>{record.date} at {record.time}</td>
                                                    <td style={{ padding: '1rem' }}>{record.scientist}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleViewRecord(record)}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div>
                        <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>
                        <div className="card">
                            <h4>Latest Dispatched Records</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                                {(() => {
                                    if (records.length === 0) return <p style={{ color: '#999', fontSize: '0.9rem' }}>No recent activity detected.</p>;

                                    return records.slice(0, 5).map(record => (
                                        <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '4px' }}>
                                            <div>
                                                <span style={{ fontWeight: 'bold' }}>{record.pathNumber}</span> - {record.fileName}
                                                <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '1rem' }}>{record.unit}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{record.date}</div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>
                                    {previewFile.professionalRole === 'DOCTOR' ? '🩺 Clinical Consultation' : (previewFile.professionalRole === 'NURSE' ? '📋 Nursing Log' : '🔬 Laboratory Analysis')}
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Patient: {previewFile.pathNumber} | Type: {previewFile.structuredResults?.testName || previewFile.fileName}</p>
                            </div>
                            <button onClick={() => setPreviewFile(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Close Preview</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f0f0', borderRadius: '4px', padding: '1rem' }}>
                            {previewFile.structuredResults ? (
                                <div style={{ width: '100%', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <h2 style={{ color: previewFile.professionalRole ? 'var(--color-navy)' : 'var(--color-sea-blue)', marginBottom: '0.5rem' }}>
                                            {previewFile.structuredResults.testName}
                                        </h2>
                                        <p style={{ color: '#666', fontWeight: 'bold' }}>
                                            {previewFile.professionalRole === 'DOCTOR' ? 'CONFIDENTIAL DOCTOR NOTES' : (previewFile.professionalRole === 'NURSE' ? 'OFFICIAL NURSING LOG' : 'OFFICIAL LABORATORY REPORT')}
                                        </p>
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                                                <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Parameter</th>
                                                <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(previewFile.structuredResults.results).map(([key, val]) => (
                                                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#555' }}>{key.toUpperCase()}</td>
                                                    <td style={{ padding: '1rem', fontSize: '1.1rem', color: 'var(--color-navy)' }}>{val || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                                        Certified by {previewFile.scientist} ({previewFile.professionalRole || 'LAB'}) on {previewFile.date} at {previewFile.time}
                                    </div>
                                </div>
                            ) : previewFile.fileData ? (
                                <>
                                    {previewFile.fileType?.startsWith('image/') ? (
                                        <img src={previewFile.fileData} alt={previewFile.fileName} style={{ maxWidth: '100%', maxHeight: '70vh', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    ) : previewFile.fileType?.startsWith('video/') ? (
                                        <video controls src={previewFile.fileData} style={{ maxWidth: '100%', maxHeight: '70vh' }} />
                                    ) : previewFile.fileType === 'application/pdf' ? (
                                        <iframe src={previewFile.fileData} style={{ width: '100%', height: '70vh', border: 'none' }} title="PDF Preview" />
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                                            <p>This file type ({previewFile.fileType}) cannot be previewed directly.</p>
                                            <a href={previewFile.fileData} download={previewFile.fileName} className="btn btn-primary">Download to View</a>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <p style={{ color: '#ff4d4f' }}>Error: No source data found for this record.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
