"use client";
import { useState, useEffect } from 'react';
import { saveGlobalRecord, getGlobalData, KEYS, updateNotificationStatus, updateAppointment } from '@/lib/global_sync';
import { useGlobalSync } from '@/lib/hooks/useGlobalSync';
import CollaborationTab from './CollaborationTab';
import { AI_SUGGESTIONS, CLINICAL_ALERTS } from '@/lib/physician_data';

import { usePatients } from '@/lib/hooks/useClinicalData';
import PatientAutofillInputs from './ui/PatientAutofillInputs';
import WhatsAppButton from './WhatsAppButton';
import CommunicationHub from './CommunicationHub';


const AlertsView = ({ professionalName, role, professionalId }) => {
    const notifications = getGlobalData(KEYS.NOTIFICATIONS, []);
    const myNotifications = notifications.filter(n =>
        (n.professionalName === professionalName || n.recipientId === role || n.recipientId === professionalId) &&
        n.status !== 'Dismissed'
    );

    const handleAction = (id, action) => {
        if (action === 'Dismiss') {
            updateNotificationStatus(id, { status: 'Dismissed' });
        } else if (action === 'Accept') {
            const notif = notifications.find(n => n.id === id);
            updateNotificationStatus(id, { status: 'Accepted' });

            if (notif && notif.details?.appointmentId) {
                updateAppointment(notif.details.appointmentId, {
                    status: 'Confirmed',
                    updatedBy: professionalName
                });
            }
            alert('Appointment Accepted!');
        }
    };

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h3>Recent Alerts 🔔</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myNotifications.length === 0 ? (
                    <p style={{ color: '#666' }}>No new alerts.</p>
                ) : (
                    myNotifications.map(notif => (
                        <div key={notif.id} className="card" style={{ padding: '1rem', border: '1px solid #eee' }}>
                            <div style={{ fontWeight: 'bold' }}>{notif.title}</div>
                            <div>{notif.message}</div>
                            {notif.details && <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                Details: {JSON.stringify(notif.details)}
                                {notif.details.balanceDue > 0 ? (
                                    <div style={{ marginTop: '0.2rem', color: '#dc2626', fontWeight: 'bold' }}>
                                        ⚠️ Part Payment: GHS {notif.details.amountPaid} (Bal: {notif.details.balanceDue})
                                    </div>
                                ) : notif.details.amountPaid ? (
                                    <div style={{ marginTop: '0.2rem', color: '#16a34a', fontWeight: 'bold' }}>
                                        ✅ Full Payment: GHS {notif.details.amountPaid}
                                    </div>
                                ) : null}
                            </div>}
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleAction(notif.id, 'Accept')} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Accept</button>
                                <button onClick={() => handleAction(notif.id, 'Dismiss')} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Dismiss</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function DieticianDashboard({ user }) {
    useGlobalSync();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const { patients } = usePatients(searchQuery);

    const normalizedPatients = patients.map(p => ({
        id: p.id,
        name: p.name,
        pathNumber: p.pathNumber,
        diet: p.profile?.dietaryRestrictions || 'Standard Diet',
        status: p.profile?.conditionStatus || 'Active',
        phoneNumber: p.phoneNumber || p.profile?.phoneNumber,
        whatsappNumber: p.whatsappNumber || p.profile?.whatsappNumber
    }));


    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedPatientName, setSelectedPatientName] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [dictatedNote, setDictatedNote] = useState('');
    const [toast, setToast] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [attachedFile, setAttachedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);





    const handleSaveDietPlan = (patientId, plan) => {
        const patient = normalizedPatients.find(p => p.id === patientId);
        saveGlobalRecord({
            pathNumber: patient?.pathNumber || 'UNKNOWN',
            fileName: 'Dietary Plan / Nutritional Assessment',
            unit: 'Dietetics',
            scientist: user.name,
            professionalRole: 'DIETICIAN',
            structuredResults: {
                testName: 'Dietary Plan',
                results: { plan }
            }
        });
        alert('Diet plan saved to patient records.');
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '80vh', gap: '1px', background: '#eee', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{ background: 'white', padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem' }}>🍎</div>
                    <h4>{user.name}</h4>
                    <p style={{ color: '#666' }}>Dietician</p>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Overview</button>
                    <button onClick={() => setActiveTab('patients')} className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>My Patients</button>
                    <button onClick={() => setActiveTab('collaboration')} className={`btn ${activeTab === 'collaboration' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Collaboration</button>
                    <button onClick={() => setActiveTab('communication')} className={`btn ${activeTab === 'communication' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Communication Hub</button>
                    <button onClick={() => setActiveTab('action-center')} className={`btn ${activeTab === 'action-center' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Action Center</button>
                    <button onClick={() => setActiveTab('engagement')} className={`btn ${activeTab === 'engagement' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Patient Engagement</button>
                    <button onClick={() => setActiveTab('alerts')} className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', textAlign: 'left' }}>Alerts</button>
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ background: 'white', padding: '2rem', overflowY: 'auto' }}>
                {activeTab === 'overview' && (
                    <div>
                        <h2>Dietary Department Overview</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#f0fdf4' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{normalizedPatients.length}</div>
                                <div>Active Patients</div>
                            </div>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#fefce8' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ca8a04' }}>5</div>
                                <div>Pending Reviews</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'patients' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                            <h2>Patient Management</h2>
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input"
                                style={{ width: '300px' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                            {/* List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {normalizedPatients.map(p => (
                                    <div
                                        key={p.id}
                                        className="card"
                                        style={{
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            border: selectedPatientId === p.id ? '2px solid var(--color-sea-blue)' : '1px solid #eee',
                                            background: selectedPatientId === p.id ? '#f0f9ff' : 'white'
                                        }}
                                        onClick={() => setSelectedPatientId(p.id)}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.pathNumber} • {p.diet}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail / Action */}
                            <div className="card" style={{ padding: '2rem' }}>
                                {selectedPatientId ? (
                                    <>
                                        {(() => {
                                            const p = normalizedPatients.find(mp => mp.id === selectedPatientId);
                                            return (
                                                <>
                                                    <h3>Diet Plan for {p.name}</h3>
                                                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                                        {p.phoneNumber && (
                                                            <a href={`tel:${p.phoneNumber}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                📞 Call {p.phoneNumber}
                                                            </a>
                                                        )}
                                                        {p.whatsappNumber && (
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <WhatsAppButton phoneNumber={p.whatsappNumber} label="Chat on WhatsApp" message={`Hello ${p.name}, this is the Dietician.`} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fafafa', borderRadius: '8px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>Current Protocol: {p.diet}</div>
                                                    </div>
                                                    <textarea
                                                        id="dietPlanInput"
                                                        placeholder="Enter new dietary plan, meal recommendations, or restrictions..."
                                                        style={{ width: '100%', minHeight: '200px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
                                                    ></textarea>
                                                    <button
                                                        onClick={() => {
                                                            const val = document.getElementById('dietPlanInput').value;
                                                            if (val) handleSaveDietPlan(p.id, val);
                                                        }}
                                                        className="btn btn-primary"
                                                    >
                                                        Save to Records
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#888', paddingTop: '4rem' }}>Select a patient to view or edit plans.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'collaboration' && <CollaborationTab user={user} />}

                {/* Communication Hub Tab */}
                {activeTab === 'communication' && (
                    <CommunicationHub
                        user={user}
                        patients={normalizedPatients}
                        initialPatientId={selectedPatientId}
                        onPatientSelect={(p) => setSelectedPatientId(p.id)}
                    />
                )}

                {/* Action Center Tab */}
                {activeTab === 'action-center' && (
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h3>Orders & Observations</h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => {
                                            setIsRecording(!isRecording);
                                            if (!isRecording) setDictatedNote('Patient requires specific low-sodium instructions.');
                                        }}>{isRecording ? '🔴 Stop' : '🎤 Dictate'}</button>
                                        <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => {
                                            if (dictatedNote) {
                                                saveGlobalRecord({
                                                    pathNumber: normalizedPatients.find(p => p.id === selectedPatientId)?.pathNumber || 'UNKNOWN',
                                                    fileName: 'Dietary Note (Dictated)',
                                                    unit: 'Dietetics',
                                                    scientist: user.name,
                                                    professionalRole: 'DIETICIAN',
                                                    structuredResults: {
                                                        testName: 'Dictated Note',
                                                        results: { note: dictatedNote }
                                                    }
                                                });
                                                setDictatedNote('');
                                                setIsRecording(false);
                                                alert('Observation saved!');
                                            } else {
                                                alert('Please dictate or type a note first.');
                                            }
                                        }}>+ Save Note</button>
                                    </div>
                                </div>

                                {isRecording && <div style={{ background: '#fff1f2', padding: '0.8rem', borderRadius: '8px', border: '1px solid #fda4af', marginBottom: '1rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    Transcribing: {dictatedNote}...
                                </div>}

                                <p style={{ color: '#666' }}>Manage dietary orders and nutritional assessments here.</p>
                            </div>
                            <div>
                                <div className="card" style={{ border: '1px solid #fbbf24', background: '#fffbeb', marginBottom: '1rem' }}>
                                    <h4 style={{ color: '#92400e', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Care Insights</h4>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        {AI_SUGGESTIONS['PATH-1234']?.alerts.map(a => (
                                            <div key={a} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                <span>🚨</span> <strong>{a}</strong>
                                            </div>
                                        )) || <p>No active AI alerts for this patient.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Patient Engagement Tab */}
                {activeTab === 'engagement' && (
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3>Patient Engagement Tools</h3>

                        {!selectedPatientId ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b', marginTop: '1rem' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👤</div>
                                <p style={{ marginBottom: '1.5rem' }}>Please select a patient from the "My Patients" tab to upload and send materials.</p>
                                <button onClick={() => setActiveTab('patients')} className="btn btn-primary">Select Patient</button>
                            </div>
                        ) : (
                            <div>
                                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>Selected Patient:</strong> <span style={{ fontSize: '1.1rem', color: '#0369a1' }}>{normalizedPatients.find(p => p.id === selectedPatientId)?.name}</span>
                                    </div>
                                    <button onClick={() => setSelectedPatientId(null)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>Change</button>
                                </div>

                                {/* File Upload Section */}
                                <div style={{ marginBottom: '2rem', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#fafafa' }}>
                                    <h4 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-navy)' }}>
                                        📤 Upload & Send Materials
                                    </h4>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
                                        Upload clinical documents, diet plans, or educational videos to send directly to the patient's record.
                                        <br /><span style={{ fontSize: '0.8rem', color: '#999' }}>Supported: PDF, Word, Excel, MP4</span>
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4"
                                                onChange={(e) => setAttachedFile(e.target.files[0])}
                                                className="input"
                                                style={{ padding: '0.8rem', background: 'white' }}
                                            />
                                        </div>

                                        {attachedFile && (
                                            <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>📎</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{attachedFile.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{(attachedFile.size / 1024 / 1024).toFixed(2)} MB • {attachedFile.type || 'Unknown Type'}</div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => {
                                                if (!attachedFile) return;
                                                setUploadingFile(true);
                                                const patient = normalizedPatients.find(p => p.id === selectedPatientId);

                                                const reader = new FileReader();
                                                reader.readAsDataURL(attachedFile);
                                                reader.onload = () => {
                                                    const base64Data = reader.result;
                                                    saveGlobalRecord({
                                                        pathNumber: patient?.pathNumber || 'UNKNOWN',
                                                        fileName: attachedFile.name,
                                                        unit: 'Dietetics',
                                                        scientist: user.name,
                                                        professionalRole: 'DIETICIAN',
                                                        structuredResults: {
                                                            testName: attachedFile.name,
                                                            recordType: 'file_upload',
                                                            fileType: attachedFile.type,
                                                            fileContent: base64Data,
                                                            results: {
                                                                "File Type": attachedFile.type,
                                                                "File Name": attachedFile.name,
                                                                "Size": (attachedFile.size / 1024).toFixed(2) + " KB",
                                                                "Uploaded By": user.name
                                                            }
                                                        }
                                                    });
                                                    setUploadingFile(false);
                                                    setAttachedFile(null);
                                                    alert(`Successfully sent ${attachedFile.name} to ${patient.name}`);
                                                };
                                                reader.onerror = () => {
                                                    setUploadingFile(false);
                                                    alert('Failed to process file');
                                                };
                                            }}
                                            disabled={!attachedFile || uploadingFile}
                                            className="btn btn-primary"
                                            style={{ padding: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            {uploadingFile ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                    Sending File...
                                                </>
                                            ) : (
                                                <>🚀 Send to Patient Record</>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ marginBottom: '1rem' }}>Standard Resources Library</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '2rem', color: '#ef4444' }}>📄</div>
                                            <div style={{ flex: 1 }}>
                                                <strong>Healthy Eating Guide</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>PDF • 2.4 MB</div>
                                            </div>
                                            <button className="btn btn-secondary" onClick={() => alert('Simulated: Sent Standard PDF to Patient')}>Send</button>
                                        </div>
                                        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #e2e8f0' }}>
                                            <div style={{ fontSize: '2rem', color: '#3b82f6' }}>🎥</div>
                                            <div style={{ flex: 1 }}>
                                                <strong>Diabetes Management</strong>
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>MP4 • 15.2 MB</div>
                                            </div>
                                            <button className="btn btn-secondary" onClick={() => alert('Simulated: Sent Standard Video to Patient')}>Send</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && <AlertsView professionalName={user.name} role={user.role} professionalId={user.id} />}
            </main>
        </div>
    );
}
