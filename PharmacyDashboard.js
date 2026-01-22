"use client";
import { useState, useEffect } from 'react';
import { PHARMACY_TABS, MOCK_PHARMACY_DATA } from '@/lib/pharmacy_data';
import { MOCK_PATIENTS, AI_SUGGESTIONS, CLINICAL_ALERTS } from '@/lib/physician_data';
import { getGlobalData, KEYS, dispatchSync, updateNotificationStatus, updateAppointment, updatePrescription, savePrescription, saveGlobalRecord } from '@/lib/global_sync';
import { useGlobalSync } from '@/lib/hooks/useGlobalSync';
import { usePatients } from '@/lib/hooks/useClinicalData';
import PatientRecordFinder from './PatientRecordFinder';
import CollaborationTab from './CollaborationTab';
import dynamic from 'next/dynamic';
import PatientAutofillInputs from './ui/PatientAutofillInputs';
import WhatsAppButton from './WhatsAppButton';
import CommunicationHub from './CommunicationHub';


const VideoConsultation = dynamic(() => import('./VideoConsultation'), { ssr: false });


const AlertsView = ({ professionalName, role, professionalId }) => {
    const notifications = getGlobalData(KEYS.NOTIFICATIONS, []);
    const myNotifications = notifications.filter(n =>
        (n.professionalName === professionalName || n.recipientId === role || n.recipientId === professionalId || n.recipientId === 'STAFF') &&
        n.status !== 'Dismissed'
    );

    const handleAction = (id, action) => {
        if (action === 'Dismiss') {
            updateNotificationStatus(id, { status: 'Dismissed' });
        } else if (action === 'Accept') {
            const notif = notifications.find(n => n.id === id);
            updateNotificationStatus(id, { status: 'Accepted' });

            // Log confirmation activity
            if (notif && notif.details?.appointmentId) {
                updateAppointment(notif.details.appointmentId, {
                    status: 'Confirmed',
                    updatedBy: professionalName
                });
            }
            alert('Appointment Accepted! Patient will be notified.');
        } else if (action === 'Snooze') {
            updateNotificationStatus(id, { status: 'Snoozed' });
        }
    };

    return (
        <div className="glass-card">
            <h3>Recent Alerts & Notifications 🔔</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Stay updated with patient bookings and payment confirmations.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myNotifications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h4>No new alerts</h4>
                        <p style={{ color: '#64748b' }}>Check back later for new patient activities.</p>
                    </div>
                ) : (
                    myNotifications.map(notif => (
                        <div key={notif.id} className="card" style={{
                            borderLeft: `5px solid ${notif.type === 'APPOINTMENT_BOOKING' ? '#3b82f6' : '#10b981'}`,
                            background: notif.status === 'Unread' ? '#f0f9ff' : 'white',
                            position: 'relative',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: 0, color: '#1e293b' }}>{notif.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.2rem 0' }}>{new Date(notif.timestamp).toLocaleString()}</p>
                                </div>
                                <span className="status-badge" style={{
                                    background: notif.status === 'Accepted' ? '#dcfce7' : '#f1f5f9',
                                    color: notif.status === 'Accepted' ? '#15803d' : '#475569'
                                }}>
                                    {notif.status}
                                </span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: '#334155' }}>{notif.message}</p>

                            {notif.details && (
                                <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                                    {notif.type === 'APPOINTMENT_BOOKING' ? (
                                        <>
                                            <div><strong>Patient:</strong> {notif.details.patientName}</div>
                                            <div><strong>Type:</strong> {notif.details.appointmentType}</div>
                                            <div><strong>Date:</strong> {notif.details.date} at {notif.details.time}</div>
                                            <div><strong>Reason:</strong> {notif.details.reason}</div>
                                            {notif.details.balanceDue > 0 ? (
                                                <div style={{ marginTop: '0.5rem', color: '#dc2626', fontWeight: 'bold' }}>
                                                    ⚠️ Part Payment: GHS {notif.details.amountPaid} (Bal: {notif.details.balanceDue})
                                                </div>
                                            ) : notif.details.amountPaid ? (
                                                <div style={{ marginTop: '0.5rem', color: '#16a34a', fontWeight: 'bold' }}>
                                                    ✅ Full Payment: GHS {notif.details.amountPaid}
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <>
                                            <div><strong>Patient:</strong> {notif.details.patientName}</div>
                                            <div><strong>Amount:</strong> {notif.details.amount}</div>
                                            <div><strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>Confirmed</span></div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                {notif.type === 'APPOINTMENT_BOOKING' && notif.status !== 'Accepted' && (
                                    <>
                                        <button onClick={() => handleAction(notif.id, 'Accept')} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Accept</button>
                                        <button onClick={() => alert('Feature coming soon: Suggesting alternative time.')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Suggest Alt Time</button>
                                    </>
                                )}
                                <button onClick={() => handleAction(notif.id, 'Snooze')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Snooze</button>
                                <button onClick={() => handleAction(notif.id, 'Dismiss')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#dc2626' }}>Dismiss</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function PharmacyDashboard({ user }) {
    if (!user) return <div className="p-8 text-center">Loading Pharmacist Dashboard...</div>;

    useGlobalSync();
    const [activeTab, setActiveTab] = useState('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [dictatedNote, setDictatedNote] = useState('');
    const [toast, setToast] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateItem, setUpdateItem] = useState(null);
    const [showNewEntryModal, setShowNewEntryModal] = useState(false);
    const [newEntryData, setNewEntryData] = useState({ patientName: '', patientId: '', drug: '', dosage: '', status: 'Pending' });

    // Fetch real patients (defensive check)
    const { patients: realPatients = [] } = usePatients(searchQuery) || {};

    // Load prescriptions from global store
    const globalPrescriptions = getGlobalData(KEYS.PRESCRIPTIONS, []);

    // Defensive: Ensure we're working with arrays and filter out nulls
    const validGlobalRx = (Array.isArray(globalPrescriptions) ? globalPrescriptions : []).filter(item => item && typeof item === 'object');
    const validMockRx = (Array.isArray(MOCK_PHARMACY_DATA?.prescriptions) ? MOCK_PHARMACY_DATA.prescriptions : []).filter(item => item && typeof item === 'object');

    // Filter to only show prescriptions for REAL patients
    const prescriptions = (validGlobalRx.length > 0 ? validGlobalRx : validMockRx).filter(rx =>
        rx && rx.patientId && Array.isArray(realPatients) && realPatients.find(p => p && (p.id === rx.patientId || p.pathNumber === rx.patientId))
    );

    // Inventory State with Persistence
    const [inventory, setInventory] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedInv = localStorage.getItem('dr_kal_inventory');
                if (savedInv) {
                    const parsed = JSON.parse(savedInv);
                    console.log('Loaded Inventory from Storage:', parsed);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const sanitized = parsed.filter(i => i && typeof i === 'object');
                        setInventory(sanitized);
                        return;
                    }
                }
            } catch (e) {
                console.error('Failed to load inventory', e);
            }
            // Fallback
            console.log('Loading MOCK Inventory');
            setInventory(Array.isArray(MOCK_PHARMACY_DATA?.inventory) ? MOCK_PHARMACY_DATA.inventory : []);
        }
    }, []);

    useEffect(() => {
        if (inventory.length > 0) {
            console.log('Persisting Inventory:', inventory);
            localStorage.setItem('dr_kal_inventory', JSON.stringify(inventory));
        }
    }, [inventory]);

    const updatePrescriptionStatus = (rxId, newStatus) => {
        // ... existing logic ...
        updatePrescription(rxId, {
            status: newStatus,
            updatedBy: user.name
        });
    };

    // ... syncPrescriptions effect ...
    // ... filteredPrescriptions logic ...
    const filteredPrescriptions = prescriptions.filter(rx =>
        (rx.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rx.drug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rx.patientId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ... existing code ...






    const handleSaveNewEntry = () => {
        if (!newEntryData.patientName || !newEntryData.drug) return alert('Please fill in required fields');

        // Save to Global Prescriptions
        const newRx = savePrescription({
            patientId: newEntryData.patientId || 'UNKNOWN',
            patientName: newEntryData.patientName,
            drug: newEntryData.drug,
            dosage: newEntryData.dosage || 'Standard',
            status: newEntryData.status,
            refillsRemaining: 3,
            doctorName: 'Manual Entry'
        });

        // Add to Mock Inventory if not exists (Optional: logic to add to inventory)
        const exists = inventory.find(i => i.name.toLowerCase() === newEntryData.drug.toLowerCase());
        if (!exists) {
            setInventory(prev => [...prev, {
                id: `INV-${Date.now()}`,
                name: newEntryData.drug,
                quantity: 100, // Default start
                unit: 'tablets',
                batch: 'BATCH-NEW',
                expiry: '2026-12-31',
                location: 'Shelf New',
                status: 'Stable',
                reorderPoint: 20
            }]);
        }

        alert('New Prescription Entry Added!');
        // setShowNewEntryModal(false); // REMOVED: Keep modal open
        // setNewEntryData({ patientName: '', patientId: '', drug: '', dosage: '', status: 'Pending' }); // REMOVED: Keep data
    };

    const handleDispense = async (rx) => {
        if (!confirm(`Confirm dispensing: ${rx.drug} for ${rx.patientName}?`)) return;

        // 1. Inventory Check & Deduct
        const drugIdx = inventory.findIndex(i => i.name.toLowerCase() === rx.drug.toLowerCase());
        if (drugIdx > -1) {
            if (inventory[drugIdx].quantity <= 0) return alert('Out of stock!');
        } else {
            if (!confirm('Drug not found in inventory. Dispense anyway?')) return;
        }

        // 2. Update Rx Status
        updatePrescription(rx.id, {
            status: 'Dispensed',
            updatedBy: user.name,
            lastFilled: new Date().toISOString()
        });

        // 3. Create Medical Record
        try {
            await saveGlobalRecord({
                pathNumber: rx.patientId,
                fileName: `Dispensed: ${rx.drug}`,
                unit: 'Pharmacy',
                unitId: 'pharmacy',
                scientist: user.name,
                professionalRole: 'PHARMACIST',
                structuredResults: {
                    testName: 'Medication Dispensation',
                    results: {
                        drug: rx.drug,
                        dosage: rx.dosage,
                        quantity: '1 Unit', // Simplified
                        action: 'Dispensed'
                    }
                }
            });
            alert('Medication Dispensed & Recorded');
        } catch (e) {
            console.error(e);
            alert('Dispensed, but failed to save record: ' + e.message);
        }

        // 4. Update Inventory State (Local)
        if (drugIdx > -1) {
            const newInv = [...inventory];
            newInv[drugIdx].quantity -= 1;
            setInventory(newInv);
        }
    };

    // Handlers replaced by PatientAutofillInputs component interaction


    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'High': return '#ff4d4f';
            case 'Medium': return '#faad14';
            default: return '#52c41a';
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', minHeight: '90vh', background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <style jsx>{`
                .sidebar-btn { width: 100%; border: none; padding: 0.8rem 1.2rem; text-align: left; background: transparent; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px; border-radius: 8px; font-weight: 500; color: #64748b; }
                .sidebar-btn:hover { background: #f1f5f9; color: var(--color-navy); }
                .sidebar-btn.active { background: var(--color-navy); color: white; box-shadow: 0 4px 12px rgba(0,0,32,0.2); }
                .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 12px; padding: 1.5rem; }
                .urgency-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
                .tab-header { margin-bottom: 2rem; display: flex; justify-content: space-between; alignItems: center; }
                .status-badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
                .interaction-flag { background: #fff1f0; border: 1px solid #ffa39e; color: #cf1322; padding: 0.5rem; border-radius: 6px; font-size: 0.8rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 8px; }
            `}</style>

            {/* Premium Sidebar */}
            <aside style={{ background: 'white', borderRight: '1px solid #e2e8f0', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                        💊
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{user.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Modern Pharmacy Operations</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {PHARMACY_TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}>
                            <span style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Stock Alert</h5>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Metformin 500mg: <strong>Low</strong></p>
                    <button style={{ marginTop: '0.8rem', width: '100%', padding: '0.4rem', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>Auto-Reorder</button>
                </div>
            </aside>

            {/* Main Workspace */}
            <main style={{ padding: '2.5rem', overflowY: 'auto' }}>
                <header className="tab-header">
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>{PHARMACY_TABS.find(t => t.id === activeTab)?.name}</h1>
                        <p style={{ margin: 0, color: '#64748b' }}>Manage your pharmacy workflow efficiently.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search by patient or drug..."
                                style={{ padding: '0.7rem 1rem 0.7rem 2.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px', outline: 'none', background: 'white' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span style={{ position: 'absolute', left: '1rem', top: '0.8rem', color: '#94a3b8' }}>🔍</span>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '0.7rem 1.2rem', borderRadius: '12px' }} onClick={() => setShowNewEntryModal(true)}>+ New Entry</button>
                    </div>
                </header>

                {showNewEntryModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="card" style={{ width: '500px', padding: '2rem', background: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Add New Prescription Entry</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <PatientAutofillInputs
                                        patientName={newEntryData.patientName}
                                        setPatientName={(val) => setNewEntryData(prev => ({ ...prev, patientName: val }))}
                                        patientId={newEntryData.patientId}
                                        setPatientId={(val) => setNewEntryData(prev => ({ ...prev, patientId: val }))}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>Drug Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Amoxicillin"
                                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                            value={newEntryData.drug}
                                            onChange={e => setNewEntryData({ ...newEntryData, drug: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>Dosage</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 500mg"
                                            style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                            value={newEntryData.dosage}
                                            onChange={e => setNewEntryData({ ...newEntryData, dosage: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: '500' }}>Status</label>
                                    <select
                                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                        value={newEntryData.status}
                                        onChange={e => setNewEntryData({ ...newEntryData, status: e.target.value })}
                                    >
                                        <option value="In Progress">In Progress</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Dispensed">Dispensed</option>
                                        <option value="Pending">Pending</option>
                                    </select>
                                </div>
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowNewEntryModal(false)}>Cancel</button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSaveNewEntry}
                                        disabled={!newEntryData.patientName || !newEntryData.drug}
                                    >
                                        Save Entry
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Contents */}
                {activeTab === 'inbox' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Priority Prescriptions</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredPrescriptions.map(rx => (
                                    <div key={rx.id} className="card" style={{ border: '1px solid #e2e8f0', transition: '0.2s', cursor: 'pointer' }} onClick={() => setSelectedPatientId(rx.patientId)}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ background: getUrgencyColor(rx.urgency), width: '10px', height: '10px', borderRadius: '50%' }}></span>
                                                    <h4 style={{ margin: 0 }}>{rx.drug} {rx.dosage}</h4>
                                                    <span className="status-badge" style={{ background: '#f1f5f9', color: '#475569' }}>{rx.status}</span>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.4rem' }}>Patient: <strong>{rx.patientName}</strong> • ID: {rx.id} • Refills: {rx.refillsRemaining}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{rx.time}</div>
                                                <div className="status-badge" style={{ marginTop: '0.5rem', background: rx.insuranceStatus === 'Verified' ? '#f0fdf4' : '#fff7ed', color: rx.insuranceStatus === 'Verified' ? '#16a34a' : '#ea580c' }}>
                                                    {rx.insuranceStatus}
                                                </div>
                                                {rx.status !== 'Dispensed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDispense(rx); }}
                                                        className="btn btn-primary"
                                                        style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--color-sea-blue)' }}
                                                    >
                                                        💊 Dispense
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {rx.issue && rx.issue !== '✅ Clear' && Array.isArray(rx.alerts) && rx.alerts.length > 0 && (
                                            <div className="interaction-flag">
                                                <span>🚨</span>
                                                <span><strong>Flag:</strong> {rx.issue} - {rx.alerts[0]}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside>
                            <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                                <h4 style={{ margin: '0 0 1rem 0' }}>AI Decision Support</h4>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                    <p>AI has analyzed checking for duplicates and dosing errors.</p>
                                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
                                        {inventory.some(i => i.quantity === 0) ? (
                                            <>
                                                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>⚠️ Shortage Warning</div>
                                                {inventory.filter(i => i.quantity === 0).map(i => (
                                                    <p key={i.id} style={{ margin: '0.5rem 0 0 0' }}>{i.name} is out of stock. AI suggests reviewing alternatives.</p>
                                                ))}
                                            </>
                                        ) : (
                                            <div style={{ color: '#10b981', fontWeight: 'bold' }}>✅ Inventory Healthy</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card">
                                <h4>Live Feed</h4>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>🔄 Sync with EHR completed (12.42 PM)</div>
                                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>📩 New Rx from Dr. Smith for Jane Smith</div>
                                    <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>🚚 Delivery #4401 successfully picked up</div>
                                </div>
                            </div>
                        </aside>
                    </div >
                )
                }

                {
                    activeTab === 'inventory' && (
                        <div className="glass-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3>Medication Management</h3>
                                <button className="btn btn-secondary" onClick={() => {
                                    // PDF Download Simulation via Print
                                    const printContent = document.getElementById('inventory-table').outerHTML;
                                    const win = window.open('', '', 'height=700,width=900');
                                    win.document.write('<html><head><title>Inventory Report</title>');
                                    win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style>');
                                    win.document.write('</head><body>');
                                    win.document.write('<h1>Pharmacy Inventory Report</h1>');
                                    win.document.write(printContent);
                                    win.document.write('</body></html>');
                                    win.document.close();
                                    win.print();
                                }}>Download Report (PDF)</button>
                            </div>
                            <table id="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '1rem' }}>Medication Name</th>
                                        <th style={{ padding: '1rem' }}>Stock Levels</th>
                                        <th style={{ padding: '1rem' }}>Batch & Expiry</th>
                                        <th style={{ padding: '1rem' }}>Location</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '1rem' }}><strong>{item.name}</strong></td>
                                            <td style={{ padding: '1rem' }}>
                                                {item.quantity} {item.unit}
                                                <div style={{ width: '60px', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '4px' }}>
                                                    <div style={{ width: `${Math.min(100, (item.quantity / 200) * 100)}%`, height: '100%', background: item.quantity < item.reorderPoint ? '#ef4444' : '#10b981', borderRadius: '2px' }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: '#475569' }}>Batch: {item.batch}</div>
                                                <div style={{ fontSize: '0.8rem', color: new Date(item.expiry) < new Date() ? '#ef4444' : '#94a3b8' }}>Expires: {item.expiry}</div>
                                            </td>
                                            <td style={{ padding: '1rem', color: '#64748b' }}>{item.location}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="status-badge" style={{
                                                    background: item.status === 'Stable' ? '#f0fdf4' : (item.status === 'Low Stock' ? '#fff7ed' : '#fef2f2'),
                                                    color: item.status === 'Stable' ? '#16a34a' : (item.status === 'Low Stock' ? '#ea580c' : '#dc2626')
                                                }}>{item.status}</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => {
                                                    setUpdateItem(item);
                                                    setShowUpdateModal(true);
                                                }}>Update</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                }

                {
                    showUpdateModal && updateItem && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                        }}>
                            <div className="card" style={{ width: '400px', padding: '2rem', background: 'white' }}>
                                <h3>Update Inventory: {updateItem.name}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem' }}>Stock Quantity</label>
                                        <input type="number" className="input" defaultValue={updateItem.quantity} onChange={(e) => setUpdateItem({ ...updateItem, quantity: parseInt(e.target.value) })} style={{ width: '100%', padding: '0.5rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem' }}>Batch Number</label>
                                        <input type="text" className="input" defaultValue={updateItem.batch} onChange={(e) => setUpdateItem({ ...updateItem, batch: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem' }}>Expiry Date</label>
                                        <input type="date" className="input" defaultValue={updateItem.expiry} onChange={(e) => setUpdateItem({ ...updateItem, expiry: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem' }}>Location</label>
                                        <input type="text" className="input" defaultValue={updateItem.location} onChange={(e) => setUpdateItem({ ...updateItem, location: e.target.value })} style={{ width: '100%', padding: '0.5rem' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                        <button className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                                        <button className="btn btn-primary" onClick={() => {
                                            // Update Logic Mock
                                            alert(`Updated ${updateItem.name} successfully! New Qty: ${updateItem.quantity}`);
                                            setShowUpdateModal(false);
                                            // Ideally call a save function here
                                        }}>Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'patients' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem' }}>
                            <div className="glass-card" style={{ height: 'fit-content' }}>
                                <h3>Patient Profiles</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                    {realPatients.length === 0 ? <p style={{ color: '#94a3b8' }}>No patients found.</p> : realPatients.map(p => (
                                        <div
                                            key={p.id}
                                            className="card"
                                            style={{ padding: '1rem', border: selectedPatientId === p.id ? '2px solid var(--color-navy)' : '1px solid #e2e8f0', cursor: 'pointer' }}
                                            onClick={() => setSelectedPatientId(p.id)}
                                        >
                                            <h4 style={{ margin: 0 }}>{p.name}</h4>
                                            <p style={{ margin: '0.2rem 0', fontSize: '0.8rem', color: '#64748b' }}>{p.pathNumber || p.id} • Age: {p.age || 'N/A'}</p>
                                            <div style={{ display: 'flex', gap: '5px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                {p.allergies && JSON.parse(p.allergies || '[]').map(a => <span key={a} style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Allergy: {a}</span>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedPatientId ? (
                                <div className="glass-card">
                                    {(() => {
                                        const p = realPatients.find(pt => pt.id === selectedPatientId);
                                        const rxHistory = prescriptions.filter(rx => rx.patientId === selectedPatientId || rx.patientName === p?.name);
                                        return (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                                    <div>
                                                        <h2>{p?.name} - Medication Insight</h2>
                                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                                            {p.phoneNumber && (
                                                                <a href={`tel:${p.phoneNumber}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    📞 Call {p.phoneNumber}
                                                                </a>
                                                            )}
                                                            {p.whatsappNumber && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <WhatsAppButton phoneNumber={p.whatsappNumber} label="Chat on WhatsApp" message={`Hello ${p.name}, this is the Pharmacy.`} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button className="btn btn-primary" onClick={() => {
                                                        let updatedInventory = [...inventory];
                                                        let processed = 0;
                                                        let failed = [];
                                                        const pending = rxHistory.filter(rx => rx.refillsRemaining > 0 && rx.status !== 'Completed');

                                                        if (pending.length === 0) return alert("No active refills pending for this patient.");

                                                        pending.forEach(rx => {
                                                            const drugIdx = updatedInventory.findIndex(i => i.name.toLowerCase().includes(rx.drug.toLowerCase()) || rx.drug.toLowerCase().includes(i.name.toLowerCase()));

                                                            if (drugIdx > -1) {
                                                                // Assume 1 unit deduction per refill event for now
                                                                if (updatedInventory[drugIdx].quantity > 0) {
                                                                    updatedInventory[drugIdx] = {
                                                                        ...updatedInventory[drugIdx],
                                                                        quantity: updatedInventory[drugIdx].quantity - 1
                                                                    };
                                                                    processed++;
                                                                    updatePrescription(rx.id, {
                                                                        refillsRemaining: rx.refillsRemaining - 1,
                                                                        lastFilled: new Date().toISOString().split('T')[0],
                                                                        status: (rx.refillsRemaining - 1) <= 0 ? 'Completed' : 'Active'
                                                                    });
                                                                } else {
                                                                    failed.push(`${rx.drug} (Out of Stock)`);
                                                                }
                                                            } else {
                                                                failed.push(`${rx.drug} (Not in Inventory)`);
                                                            }
                                                        });

                                                        setInventory(updatedInventory);
                                                        alert(`Processed ${processed} refills.\n${failed.length > 0 ? 'Issues: ' + failed.join(', ') : 'Inventory updated successfully.'}`);
                                                    }}>Sync Refills</button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                    <div>
                                                        <h4>Adherence Tracking</h4>
                                                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                                                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a' }}>{rxHistory[0]?.adherence || 'N/A'}</div>
                                                            <p style={{ margin: 0, color: '#64748b' }}>Overall Compliance</p>
                                                        </div>
                                                        <h4 style={{ marginTop: '1.5rem' }}>Counseling Notes</h4>
                                                        <textarea
                                                            id="counseling-note"
                                                            placeholder="Add special instructions or counselor notes..."
                                                            style={{ width: '100%', height: '100px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem', outline: 'none' }}
                                                        ></textarea>
                                                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={async () => {
                                                            const note = document.getElementById('counseling-note').value;
                                                            if (!note) return alert("Please type a note first.");
                                                            try {
                                                                await fetch('/api/messages', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        recipientId: p.id,
                                                                        recipientName: p.name,
                                                                        content: `Pharmacist Note: ${note}`,
                                                                        type: 'ALERT'
                                                                    })
                                                                });
                                                                alert('Note sent to patient successfully!');
                                                                document.getElementById('counseling-note').value = '';
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Failed to send note.');
                                                            }
                                                        }}>Send Note to Patient 🔔</button>
                                                    </div>
                                                    <div>
                                                        <h4>Active Prescriptions</h4>
                                                        {rxHistory.length > 0 ? rxHistory.map(rx => (
                                                            <div key={rx.id} style={{ padding: '1rem', border: '1px solid #e1e8f0', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                                                <strong>{rx.drug}</strong>
                                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Remains: {rx.refillsRemaining} refills</div>
                                                            </div>
                                                        )) : <p style={{ color: '#94a3b8' }}>No active prescriptions found.</p>}
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    Select a patient to view full history and adherence.
                                </div>
                            )}
                        </div>
                    )
                }

                {
                    activeTab === 'telepharmacy' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                            {showVideoCall ? (
                                <div className="glass-card" style={{ height: '500px', overflow: 'hidden', padding: 0 }}>
                                    <VideoConsultation user={user} patientId={selectedPatientId || 'PATH-GENERAL'} />
                                    <button onClick={() => setShowVideoCall(false)} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50 }}>Close Call</button>
                                </div>
                            ) : (
                                <div className="glass-card" style={{ background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '450px' }}>
                                    <div style={{ fontSize: '4rem' }}>🎧</div>
                                    <h3>Telepharmacy Console</h3>
                                    <p style={{ opacity: 0.7 }}>Secure video link for medication counseling or renewals.</p>
                                    <button className="btn btn-primary" style={{ padding: '1rem 2rem', background: '#3b82f6', border: 'none' }} onClick={() => setShowVideoCall(true)}>Go Online (Start Video)</button>
                                </div>
                            )}

                            <div className="glass-card">
                                <h3>Secure Messaging (Direct)</h3>
                                <div style={{ height: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', marginBottom: '1rem', padding: '0.5rem' }}>
                                    <div style={{ alignSelf: 'flex-start', background: '#f1f5f9', padding: '0.8rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                                        <strong>System:</strong> "Select a patient to message."
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <select
                                        className="input"
                                        style={{ marginBottom: '0.5rem' }}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        value={selectedPatientId || ''}
                                    >
                                        <option value="">Select Patient</option>
                                        {realPatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input id="tele-msg" type="text" placeholder="Type a message..." style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                        <button className="btn btn-primary" onClick={async () => {
                                            const content = document.getElementById('tele-msg').value;
                                            if (!content || !selectedPatientId) return alert('Select patient and type message.');
                                            try {
                                                const p = realPatients.find(pt => pt.id === selectedPatientId);
                                                await fetch('/api/messages', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        recipientId: selectedPatientId,
                                                        recipientName: p?.name || 'Patient',
                                                        content: `[Secure Pharm]: ${content}`,
                                                        type: 'ALERT'
                                                    })
                                                });
                                                alert('Message sent!');
                                                document.getElementById('tele-msg').value = '';
                                            } catch (e) { console.error(e); alert('Failed'); }
                                        }}>Send</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'patient-records' && (
                        <div>
                            <PatientRecordFinder
                                title="Patient Medical Records"
                                description="Search for any patient by PATH number or Name to view their complete medical history."
                                patients={realPatients} // Pass real patients if supported, else Finder needs update
                            />
                        </div>
                    )
                }

                {/* Communication Hub Tab */}
                {
                    activeTab === 'communication' && (
                        <CommunicationHub
                            user={user}
                            patients={realPatients}
                            initialPatientId={selectedPatientId}
                            onPatientSelect={(p) => setSelectedPatientId(p.id)}
                        />
                    )
                }

                {/* Action Center Tab */}
                {
                    activeTab === 'action-center' && (
                        <div className="glass-card">
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h3>Orders & Observations</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => {
                                                setIsRecording(!isRecording);
                                                if (!isRecording) setDictatedNote('Reviewing prescription for interactions.');
                                            }}>{isRecording ? '🔴 Stop' : '🎤 Dictate (Pharmacist Note)'}</button>
                                            <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => {
                                                if (dictatedNote) {
                                                    saveGlobalRecord({
                                                        pathNumber: MOCK_PATIENTS.find(p => p.id === selectedPatientId)?.pathNumber || 'UNKNOWN',
                                                        fileName: 'Pharmacist Note (Dictated)',
                                                        unit: 'Pharmacy',
                                                        scientist: user.name,
                                                        professionalRole: 'PHARMACIST',
                                                        structuredResults: {
                                                            testName: 'Dictated Note',
                                                            results: { note: dictatedNote }
                                                        }
                                                    });
                                                    setDictatedNote('');
                                                    setIsRecording(false);
                                                    alert('Note saved to records!');
                                                } else {
                                                    alert('Please dictate or type a note first. Ensure a patient is selected contextually or the note will safely default.');
                                                }
                                            }}>+ Save Note</button>
                                        </div>
                                    </div>

                                    {isRecording && <div style={{ background: '#fff1f2', padding: '0.8rem', borderRadius: '8px', border: '1px solid #fda4af', marginBottom: '1rem', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Transcribing: {dictatedNote}...
                                    </div>}

                                    <p style={{ color: '#64748b' }}>Use this area to document clinical interventions and medication reconciliation notes.</p>
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
                    )
                }

                {/* Patient Engagement Tab */}
                {
                    activeTab === 'engagement' && (
                        <div className="glass-card">
                            <h3>Patient Engagement Tools</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem', marginTop: '1.5rem' }}>
                                <div>
                                    <h4 style={{ marginBottom: '1rem' }}>Medication Education</h4>
                                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                                        <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                                            <span>"How to take Lisinopril" (Video)</span>
                                            <button className="btn btn-primary" style={{ fontSize: '0.7rem' }}>Send to Patient</button>
                                        </div>
                                        <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                                            <span>Insulin Injection Guide (PDF)</span>
                                            <button className="btn btn-primary" style={{ fontSize: '0.7rem' }}>Send to Patient</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    activeTab === 'alerts' && (
                        <AlertsView professionalName={user.name} role={user.role} professionalId={user.id} />
                    )
                }
            </main >
        </div >
    );
}
