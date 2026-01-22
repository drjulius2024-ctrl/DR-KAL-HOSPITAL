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

export default function PsychologistDashboard({ user }) {
    useGlobalSync();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const { patients } = usePatients(searchQuery);

    const normalizedPatients = patients.map(p => ({
        id: p.id,
        name: p.name,
        pathNumber: p.pathNumber,
        status: p.profile?.conditionStatus || 'Ongoing',
        notes: p.profile?.medicalHistory || 'Active Assessment',
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




    const handleSaveNote = (patientId, note) => {
        const patient = normalizedPatients.find(p => p.id === patientId);
        saveGlobalRecord({
            pathNumber: patient?.pathNumber || 'UNKNOWN',
            fileName: 'Psychotherapy Note / Clinical Assessment',
            unit: 'Psychology',
            scientist: user.name,
            professionalRole: 'PSYCHOLOGIST',
            structuredResults: {
                testName: 'Therapy Session Note',
                results: { note }
            }
        });
        alert('Confidential therapy note saved.');
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '80vh', gap: '1px', background: '#eee', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{ background: 'white', padding: '1.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem' }}>🧠</div>
                    <h4>{user.name}</h4>
                    <p style={{ color: '#666' }}>Psychologist</p>
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
                        <h2>Psychology Department Overview</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#f0f9ff' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0ea5e9' }}>{normalizedPatients.length}</div>
                                <div>Active Cases</div>
                            </div>
                            <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#f5f3ff' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>3</div>
                                <div>Pending Intakes</div>
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
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.pathNumber} • {p.status}</div>
                                        {(() => {
                                            const { KEYS } = require('@/lib/global_sync');
                                            const allApps = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]') : [];
                                            const nextApp = allApps.find(a => (a.patientId === p.id || a.patientName === p.name) && a.status === 'Upcoming');
                                            if (nextApp && nextApp.balanceDue > 0) {
                                                return <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 'bold', marginTop: '0.3rem' }}>⚠️ Bal: GHS {nextApp.balanceDue}</div>;
                                            }
                                            return null;
                                        })()}
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
                                                    <h3>Therapy Session: {p.name}</h3>
                                                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                                        {p.phoneNumber && (
                                                            <a href={`tel:${p.phoneNumber}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                📞 Call {p.phoneNumber}
                                                            </a>
                                                        )}
                                                        {p.whatsappNumber && (
                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                <WhatsAppButton phoneNumber={p.whatsappNumber} label="Chat on WhatsApp" message={`Hello ${p.name}, this is the Psychologist.`} />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fafafa', borderRadius: '8px' }}>
                                                        <div style={{ fontWeight: 'bold' }}>Reason: {p.notes}</div>
                                                    </div>
                                                    <textarea
                                                        id="therapyNoteInput"
                                                        placeholder="Confidential session notes..."
                                                        style={{ width: '100%', minHeight: '200px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
                                                    ></textarea>
                                                    <button
                                                        onClick={() => {
                                                            const val = document.getElementById('therapyNoteInput').value;
                                                            if (val) handleSaveNote(p.id, val);
                                                        }}
                                                        className="btn btn-primary"
                                                    >
                                                        Save Confidential Note
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#888', paddingTop: '4rem' }}>Select a patient to begin session.</div>
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
                                            if (!isRecording) setDictatedNote('Client shows signs of improved mood.');
                                        }}>{isRecording ? '🔴 Stop' : '🎤 Dictate'}</button>
                                        <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => {
                                            if (dictatedNote) {
                                                saveGlobalRecord({
                                                    pathNumber: MOCK_PATIENTS.find(p => p.id === selectedPatientId)?.pathNumber || 'UNKNOWN',
                                                    fileName: 'Psychology Note (Dictated)',
                                                    unit: 'Psychology',
                                                    scientist: user.name,
                                                    professionalRole: 'PSYCHOLOGIST',
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

                                <p style={{ color: '#666' }}>Manage psychological assessments and therapy notes.</p>
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginTop: '1.5rem' }}>
                            <div>
                                <h4 style={{ marginBottom: '1rem' }}>Educational Resources</h4>
                                <div style={{ display: 'grid', gap: '0.8rem' }}>
                                    <div style={{ padding: '0.8rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Stress Management Guide (PDF)</span>
                                        <button className="btn btn-primary" style={{ fontSize: '0.7rem' }}>Send to Patient</button>
                                    </div>
                                    <div style={{ padding: '0.8rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Meditation Techniques (Video)</span>
                                        <button className="btn btn-primary" style={{ fontSize: '0.7rem' }}>Send to Patient</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'alerts' && <AlertsView professionalName={user.name} role={user.role} professionalId={user.id} />}
            </main>
        </div>
    );
}
