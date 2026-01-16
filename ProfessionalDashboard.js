"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';

import {
    Calendar, Users, Activity, FileText, MessageSquare,
    Video, Settings, Bell, Search, Mic, Plus
} from 'lucide-react';

import { ROLES } from '@/lib/auth_constants';
import { LAB_TESTS } from '@/lib/lab_tests_data';
import { CLINICAL_MODULES } from '@/lib/clinical_data';
import { PHYSICIAN_TABS, AI_SUGGESTIONS, CLINICAL_ALERTS } from '@/lib/physician_data';
import { saveGlobalRecord, updateAppointment, getGlobalData, performTriage, updatePatientVitals, KEYS } from '@/lib/global_sync';
import { analyzeResult, REFERENCE_RANGES } from '@/lib/medical_analysis';
import { useGlobalSync } from '@/lib/hooks/useGlobalSync';
import { usePatients, useVitals, useTasks } from '@/lib/hooks/useClinicalData';
import NurseDashboard from './NurseDashboard';
import PharmacyDashboard from './PharmacyDashboard';
import DieticianDashboard from './DieticianDashboard';
import PsychologistDashboard from './PsychologistDashboard';
import PatientRecordFinder from './PatientRecordFinder';
import CollaborationTab from './CollaborationTab';
import CalendarView from './CalendarView';
import EngagementTab from './EngagementTab';
import Toast from './Toast';
import VitalsMonitor from './VitalsMonitor';
import DictationRecorder from './DictationRecorder';
import DashboardLayout from './DashboardLayout';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import AnalyticsWidget from './AnalyticsWidget';
import PatientAutofillInputs from './ui/PatientAutofillInputs';
import WhatsAppButton from './WhatsAppButton';
import ProfileModal from './ProfileModal';
import VideoConsultation from './VideoConsultation';
import CommunicationHub from './CommunicationHub';


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
                // Trigger "In Progress"
                updateAppointmentStatus(notif.details.appointmentId, { status: 'In Progress' });
            }
            alert('Appointment Accepted! Status set to In Progress. Patient will be notified.');
        } else if (action === 'Snooze') {
            updateNotificationStatus(id, { status: 'Snoozed' });
        }
    };

    return (
        <Card title="Recent Alerts & Notifications 🔔">
            <p style={{ color: 'var(--color-grey-500)', marginBottom: '1.5rem' }}>Stay updated with patient bookings and payment confirmations.</p>

            <div className="alerts-container">
                {myNotifications.length === 0 ? (
                    <div className="alert-empty-state">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h4>No new alerts</h4>
                        <p style={{ color: 'var(--color-grey-500)' }}>Check back later for new patient activities.</p>
                    </div>
                ) : (
                    myNotifications.map(notif => (
                        <Card key={notif.id} className="alert-card" style={{
                            borderColor: notif.type === 'APPOINTMENT_BOOKING' ? '#3b82f6' : '#10b981',
                            background: notif.status === 'Unread' ? '#f0f9ff' : 'white',
                        }}>
                            <div className="alert-header">
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--color-grey-900)' }}>{notif.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-grey-500)', margin: '0.2rem 0' }}>{new Date(notif.timestamp).toLocaleString()}</p>
                                </div>
                                <Badge variant={notif.status === 'Accepted' ? 'success' : 'neutral'}>
                                    {notif.status}
                                </Badge>
                            </div>
                            <p style={{ margin: '0 0 1rem 0' }}>{notif.message}</p>

                            {notif.details && (
                                <div className="alert-details">
                                    {notif.type === 'APPOINTMENT_BOOKING' ? (
                                        <>
                                            <div><strong>Patient:</strong> {notif.details.patientName}</div>
                                            <div><strong>Type:</strong> {notif.details.appointmentType}</div>
                                            <div><strong>Date:</strong> {notif.details.date} at {notif.details.time}</div>
                                            <div><strong>Reason:</strong> {notif.details.reason}</div>
                                            {notif.details.balanceDue > 0 ? (
                                                <div style={{ marginTop: '0.5rem', color: 'var(--color-error)', fontWeight: 'bold' }}>
                                                    ⚠️ Part Payment: GHS {notif.details.amountPaid} (Bal: {notif.details.balanceDue})
                                                </div>
                                            ) : notif.details.amountPaid ? (
                                                <div style={{ marginTop: '0.5rem', color: 'var(--color-success)', fontWeight: 'bold' }}>
                                                    ✅ Full Payment: GHS {notif.details.amountPaid}
                                                </div>
                                            ) : null}
                                        </>
                                    ) : (
                                        <>
                                            <div><strong>Patient:</strong> {notif.details.patientName}</div>
                                            <div><strong>Amount:</strong> {notif.details.amount}</div>
                                            <div><strong>Status:</strong> <Badge variant="success">Confirmed</Badge></div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="alert-actions">
                                {notif.type === 'APPOINTMENT_BOOKING' && notif.status !== 'Accepted' && (
                                    <>
                                        <Button onClick={() => handleAction(notif.id, 'Accept')} variant="primary" size="sm">Accept</Button>
                                        <Button onClick={() => alert('Feature coming soon: Suggesting alternative time.')} variant="secondary" size="sm">Suggest Alt Time</Button>
                                    </>
                                )}
                                <Button onClick={() => handleAction(notif.id, 'Snooze')} variant="secondary" size="sm">Snooze</Button>
                                <Button onClick={() => handleAction(notif.id, 'Dismiss')} variant="danger" size="sm">Dismiss</Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </Card>
    );
};

export default function ProfessionalDashboard({ user }) {
    const router = useRouter();
    useGlobalSync(); // Trigger re-render on any global change

    // [NEW] State for Video Consultation
    const [showVideoConsultation, setShowVideoConsultation] = useState(false);

    // Socket Listener
    useEffect(() => {
        const socket = getSocket();
        if (socket && user) {
            socket.emit('join_room', user.id);

            socket.on('appointment_change', () => {
                // Refresh data
                // In a real app we would refetch, but here we trigger sync tick or rely on optimistic updates
                // dispatchSync() is available via import but we need to use it.
                // Wait, useGlobalSync returns 'syncTick' but doesn't expose dispatchSync?
                // The global_sync module exports dispatchSync? No, it exports internal dispatch logic?
                // Actually `useGlobalSync` just listens.
                // We need to trigger a re-eval or re-fetch.
                // We can force a re-render or re-fetch apiPatients.
            });
            socket.on('receive_message', () => { }); // Handle messages

            return () => {
                socket.off('appointment_change');
                socket.off('receive_message');
            };
        }
    }, [user]);
    const isScientist = user.role === ROLES.SCIENTIST;
    const isDoctor = user.role === ROLES.DOCTOR;
    const isNurse = user.role === ROLES.NURSE;
    const isPharmacist = user.role === ROLES.PHARMACIST;
    const isDietician = user.role === ROLES.DIETICIAN;
    const isPsychologist = user.role === ROLES.PSYCHOLOGIST;


    const [activeLabTab, setActiveLabTab] = useState(isScientist ? 'haematology' : (isDoctor ? 'smart-list' : 'NURSE'));
    const [activeLabView, setActiveLabView] = useState('entry'); // 'entry' or 'history'
    const [activeTest, setActiveTest] = useState(null);
    const [testResults, setTestResults] = useState({});

    // Manual Entry State
    const [manualEntry, setManualEntry] = useState({
        testName: '', resultValue: '', unit: '', normalRange: '', flag: '', notes: ''
    });



    const handleManualChange = (e) => {
        setManualEntry(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const [patientRecords, setPatientRecords] = useState([]);
    const [apiAppointments, setApiAppointments] = useState([]); // [NEW] API source
    const [pathSearch, setPathSearch] = useState('');
    const [lastUploaded, setLastUploaded] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [selectedPatientName, setSelectedPatientName] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [dictatedNote, setDictatedNote] = useState('');

    // Action Center Inputs
    const [actionMedicalHistory, setActionMedicalHistory] = useState('');
    const [actionTreatmentPlan, setActionTreatmentPlan] = useState('');
    const [actionMedication, setActionMedication] = useState('');
    const [actionReviewActivities, setActionReviewActivities] = useState('');

    // List for medications to handle additions
    const [medicationList, setMedicationList] = useState([]);

    const [toast, setToast] = useState(null);

    // [NEW] Fetch Appointments from API
    useEffect(() => {
        const fetchApiData = async () => {
            try {
                // Fetch all appointments (filtered by professionalId server-side ideally, but for now we fetch all and filter locally for scientist if needed, or api returns all for professionals)
                const resApps = await fetch('/api/appointments');
                if (resApps.ok) {
                    const data = await resApps.json();
                    setApiAppointments(data);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard data", e);
            }
        };

        fetchApiData();
    }, [user, user?.role]); // Re-fetch if user changes
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // [NEW] Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);

    // [NEW] Profile Update Handler
    // [NEW] Local User State for Immediate Feedback
    const [currentUser, setCurrentUser] = useState(user);

    // Sync if server user updates (e.g. reload or re-auth)
    useEffect(() => {
        if (user) setCurrentUser(user);
    }, [user]);

    // [NEW] Profile Update Handler
    const handleProfileUpdate = (updatedUser) => {
        setCurrentUser(updatedUser); // Immediate UI update
        router.refresh(); // Refresh server state
        setToast({ message: 'Profile updated successfully!', type: 'success' });
    };

    // Data Sync
    // Data Sync - using SWR Hooks
    const { patients: apiPatients, isLoading: loadingPatients } = usePatients(pathSearch); // Search filters if provided

    const patients = apiPatients.length > 0 ? apiPatients.map(u => {
        // Map API data to Dashboard shape
        const profile = u.profile || {};
        const latestVital = u.latestVital || {};

        return {
            id: u.id,
            name: u.name,
            role: 'Patient',
            // Contact Info
            phoneNumber: u.phoneNumber || profile.phoneNumber || 'N/A',
            whatsappNumber: u.whatsappNumber || profile.whatsappNumber || 'N/A',
            country: u.country || 'Ghana',
            region: u.region || 'Unknown',

            age: profile.dateOfBirth ? new Date().getFullYear() - new Date(profile.dateOfBirth).getFullYear() : 'N/A',
            gender: profile.gender || 'Unknown',
            acuity: profile.conditionStatus === 'Critical' ? 'High' : (profile.conditionStatus === 'Admitted' ? 'Medium' : 'Low'),
            activeIssues: [profile.medicalHistory || 'Routine Checkup'],
            vitals: {
                bp: latestVital.bloodPressure || '120/80',
                hr: latestVital.heartRate || '72',
                spo2: (latestVital.spo2 || '98') + '%'
            },
            recentLabs: {}, // To be implemented with Lab API
            alerts: u.activeAlerts || [],
            allergies: profile.allergies ? [profile.allergies] : [],
            history: profile.medicalHistory || 'No significant history recorded.',
            meds: profile.currentMedications ? [profile.currentMedications] : [],
            carePlan: 'Routine monitoring based on latest vitals.',
            risks: u.triage ? [u.triage.level] : [],
            // Mapped Financials
            totalDebt: u.financials?.totalDebt || 0,
            financialStatus: u.financials?.status || 'Clear'
        };
    }) : [];


    const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

    // Effect to sync medication list and fetch records when patient changes
    useEffect(() => {
        if (selectedPatient) {
            setMedicationList(selectedPatient.meds || []);
            fetchPatientRecords();
        }
    }, [selectedPatientId]);

    // Auto-analyze manual entry
    useEffect(() => {
        if (!manualEntry.testName) return;

        // Try to find test definition
        let foundCat = null;
        let foundTest = null;

        for (const [cat, tests] of Object.entries(REFERENCE_RANGES)) {
            const key = Object.keys(tests).find(k => k.toLowerCase() === manualEntry.testName.toLowerCase());
            if (key) {
                foundCat = cat;
                foundTest = key;
                break;
            }
        }

        if (foundCat && foundTest && selectedPatient) {
            const age = selectedPatient.age || 30;
            const sex = selectedPatient.gender || 'Male'; // Use gender from patient object
            const analysis = analyzeResult(foundCat, foundTest, manualEntry.resultValue, age, sex);

            if (analysis) {
                setManualEntry(prev => ({
                    ...prev,
                    unit: prev.unit || analysis.unit,
                    normalRange: prev.normalRange || analysis.range,
                    flag: analysis.flag !== 'Normal' ? analysis.flag : prev.flag
                }));
            }
        }
    }, [manualEntry.testName, manualEntry.resultValue, selectedPatient]);


    const fileInputRef = useRef(null);

    if (isNurse) return <NurseDashboard user={user} onAvatarClick={() => setShowProfileModal(true)} />;
    if (isPharmacist) return <PharmacyDashboard user={user} onAvatarClick={() => setShowProfileModal(true)} />;
    if (isDietician) return <DieticianDashboard user={user} onAvatarClick={() => setShowProfileModal(true)} />;
    if (isPsychologist) return <PsychologistDashboard user={user} onAvatarClick={() => setShowProfileModal(true)} />;

    // ... (rest of filtering) ...

    // ... (rest of filtering) ...

    const labUnits = [
        { id: 'haematology', name: 'Haematology', icon: '🩸' },
        { id: 'microbiology', name: 'Microbiology', icon: '🦠' },
        { id: 'pathology', name: 'Pathology', icon: '🔬' },
        { id: 'immunology', name: 'Immunology', icon: '🛡️' },
        { id: 'chemical_path', name: 'Chem. Path.', icon: '🧪' },
        { id: 'sti', name: 'STI', icon: '🩺' },
        { id: 'communication', name: 'Communication Hub', icon: '📨' },
        { id: 'collaboration', name: 'Collaboration', icon: '👨‍⚕️' },
        { id: 'patient-records', name: 'Patient Records', icon: '🗂️' },
        { id: 'alerts', name: 'Alerts 🔔', icon: '🔔' }
    ];

    const fetchMessages = async () => {
        if (!selectedPatientId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/messages?patientId=${selectedPatientId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages(data);
                } else {
                    console.error("API returned non-array messages:", data);
                    setMessages([]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch messages", e);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (activeLabTab === 'communication' && selectedPatientId) {
            fetchMessages();
        }
    }, [activeLabTab, selectedPatientId]);

    // --- Lab History & Management ---
    const fetchPatientRecords = async () => {
        if (!selectedPatient?.id) return;
        try {
            const res = await fetch(`/api/records?patientId=${selectedPatient.id}`);
            if (res.ok) {
                const data = await res.json();
                setPatientRecords(data);
            }
        } catch (e) { console.error("Failed to fetch records", e); }
    };

    const deleteRecord = async (id) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this record? This cannot be undone.')) return;
        try {
            const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Record deleted successfully.');
                fetchPatientRecords(); // Refresh list
            } else {
                alert('Failed to delete: ' + (data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting record.');
        }
    };

    const handleAction = async (action) => {
        if (action === 'Upload') {
            fileInputRef.current?.click();
        } else if (action === 'Print') {
            window.print();
        } else if (action === 'Dispatch') {
            if (!pathSearch) {
                alert('Please enter a Patient Path Number before dispatching.');
                return;
            }

            if (!lastUploaded && !activeTest) {
                alert('Please upload a file OR select a test and enter results before dispatching.');
                return;
            }

            const currentFile = uploadedFiles.find(f => f.name === lastUploaded);

            let testSource = isScientist ? LAB_TESTS[activeLabTab] : CLINICAL_MODULES[user.role];
            let activeTestData = testSource?.find(t => t.id === activeTest);

            const newRecord = {
                pathNumber: pathSearch.toUpperCase(),
                unit: isScientist ? labUnits.find(u => u.id === activeLabTab)?.name : user.role,
                unitId: activeLabTab,
                fileName: lastUploaded || (activeTest ? `Clinical Record: ${activeTestData?.name}` : 'Result'),
                fileType: currentFile?.type || 'application/json',
                fileData: currentFile?.data || null,
                structuredResults: activeTest ? {
                    testId: activeTest,
                    testName: activeTestData?.name,
                    results: testResults
                } : null,
                scientist: user.name,
                professionalRole: user.role
            };

            try {
                await saveGlobalRecord(newRecord);

                // [NEW] Attempt to mark active appointment as 'Services Rendered'
                // We find the most recent 'In Progress' or 'Upcoming' appointment for this patient/prof
                const { updateAppointmentStatus, KEYS } = require('@/lib/global_sync'); // Import dynamically/safely
                const allApps = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
                const relevantApp = allApps.find(a =>
                    a.patientId === (patients.find(p => p.pathNumber === newRecord.pathNumber)?.id || currentPatientId) &&
                    (a.status === 'In Progress' || a.status === 'Upcoming') &&
                    (isScientist || a.professionalId === user.id) // Scientists can fulfill any lab order
                );

                if (relevantApp) {
                    updateAppointmentStatus(relevantApp.id, { servicesRendered: true });
                    console.log(`Marked services rendered for Appointment ${relevantApp.id}`);
                }

                if (uploadedFiles.length > 0) {
                    handleConfirmFile(uploadedFiles[0]?.id);
                }

                alert(`Result successfully DISPATCHED to Patient ${pathSearch}!`);

                // RESET
                setActiveTest(null);
                setTestResults({});
                setLastUploaded(null);
            } catch (err) {
                alert(`Dispatch FAILED: ${err.message}. Please check the Path Number.`);
            }
        } else {
            alert(`${action} performed successfully for current unit.`);
        }
    };
    // --- File Upload via API ---
    const onFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large (Max 5MB)");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                const newFile = {
                    id: Date.now(),
                    name: file.name,
                    url: data.url, // URL from storage adapter
                    type: file.type,
                    date: new Date().toLocaleDateString(),
                    status: 'Pending'
                };
                setUploadedFiles(prev => [...prev, newFile]);
            } else {
                alert("Upload failed: " + data.error);
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Upload failed due to server error");
        }
    };

    const handleDeleteFile = (id) => {
        if (confirm('Are you sure you want to delete this file?')) {
            setUploadedFiles(prev => prev.filter(f => f.id !== id));
        }
    };

    const handleConfirmFile = (id) => {
        setUploadedFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'Confirmed' } : f));
    };

    // Layout Items
    const sidebarItems = isScientist ? labUnits : PHYSICIAN_TABS;

    return (
        <DashboardLayout
            role={currentUser.role}
            userName={currentUser.name}
            avatarUrl={currentUser.avatarUrl} // [NEW]
            sidebarItems={sidebarItems}
            activeTab={activeLabTab}
            onTabChange={setActiveLabTab}
            onAvatarClick={() => setShowProfileModal(true)}
        >
            {showProfileModal && (
                <ProfileModal
                    user={currentUser}
                    onClose={() => setShowProfileModal(false)}
                    onSave={handleProfileUpdate}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <style>
                {`
                    @media print {
                        body { background: white !important; }
                        nav, header, aside, .btn, .badge, .no-print { display: none !important; }
                        .container { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; display: block !important; }
                        .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
                        .print-only { display: block !important; }
                        table { width: 100% !important; border: 1px solid #000 !important; border-collapse: collapse !important; }
                        th, td { border: 1px solid #ddd !important; padding: 8px !important; }
                        h1, h2, h3 { color: black !important; }
                    }
                    .print-only { display: none; }
                `}
            </style>

            {/* Hidden Input for File Uploads */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,image/*,video/*"
            />

            {/* Print Header */}
            <div className="print-only" style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                <img src="/logo.png" alt="Dr Kal Logo" style={{ height: '80px', marginBottom: '1rem' }} />
                <h1 style={{ margin: 0 }}>DR KAL'S VIRTUAL HOSPITAL</h1>
                <h2 style={{ margin: '0.5rem 0' }}>OFFICIAL LABORATORY REPORT</h2>
                <p style={{ fontSize: '0.9rem' }}>Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Main Content */}
            <>
                {/* Dynamic Title for Context */}
                <div style={{ marginBottom: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-primary-800)' }}>
                        {isScientist ?
                            (labUnits.find(u => u.id === activeLabTab)?.name || 'Laboratory') :
                            (PHYSICIAN_TABS.find(t => t.id === activeLabTab)?.name || 'Dashboard')}
                    </h2>
                    <p style={{ color: 'var(--color-grey-500)', marginTop: '0.2rem' }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {isDoctor ? (
                    <div className="physician-content" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                        {!selectedPatient ? (
                            <Card>
                                <div className="p-8 text-center text-gray-500">
                                    <h3>No Patients Found</h3>
                                    <p>Try adjusting your search filters or adding a new patient.</p>
                                </div>
                            </Card>
                        ) : (
                            <>
                                {/* Smart Patient List Tab */}
                                {activeLabTab === 'smart-list' && (
                                    <Card>
                                        <div className="filter-bar">
                                            <h3>Smart Patient List</h3>
                                            <div className="filter-controls">
                                                <Input type="text" placeholder="Search patients..." style={{ margin: 0, height: '40px' }} fullWidth />
                                                <select className="input-field" style={{ padding: '0.4rem' }}>
                                                    <option>Sort by Acuity</option>
                                                    <option>Sort by Last Name</option>
                                                    <option>Sort by Alerts</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="patient-list-grid">
                                            {patients.map(patient => (
                                                <div key={patient.id}
                                                    onClick={() => {
                                                        setSelectedPatientId(patient.id);
                                                        logAudit({
                                                            actorId: user.id,
                                                            actorName: user.name,
                                                            action: 'viewed_chart_hub',
                                                            targetId: patient.id,
                                                            targetName: patient.name,
                                                            location: 'SmartPatientList'
                                                        });
                                                    }}
                                                    className={`patient-card ${selectedPatientId === patient.id ? 'selected' : ''}`}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <strong style={{ fontSize: '1.1rem' }}>{patient.name}</strong>
                                                            <Badge variant={patient.acuity === 'High' ? 'error' : (patient.acuity === 'Medium' ? 'warning' : 'success')}>
                                                                {patient.acuity} Acuity
                                                            </Badge>
                                                        </div>
                                                        {patient.id} • {patient.age}y {patient.gender} • {patient.activeIssues.join(', ')}
                                                        <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                                            {patient.phoneNumber && (
                                                                <a href={`tel:${patient.phoneNumber.replace(/[^\d+]/g, '')}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                    📞 Call {patient.phoneNumber}
                                                                </a>
                                                            )}
                                                            {patient.whatsappNumber && (
                                                                <div onClick={(e) => e.stopPropagation()}>
                                                                    <WhatsAppButton phoneNumber={patient.whatsappNumber} label="WhatsApp" message={`Hello ${patient.name}, this is Dr. Kal's office.`} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {(() => {
                                                            const { KEYS } = require('@/lib/global_sync');
                                                            const allApps = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]') : [];
                                                            const nextApp = allApps
                                                                .filter(a => (a.patientId === patient.id || a.patientName === patient.name) && a.status === 'Upcoming')
                                                                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

                                                            if (patient.totalDebt > 0) {
                                                                return (
                                                                    <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: 'var(--color-error)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                        ⚠️ Outstanding Debt: GHS {patient.totalDebt.toFixed(2)}
                                                                    </div>
                                                                );
                                                            } else if (nextApp && nextApp.amountPaid) {
                                                                return (
                                                                    <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--color-success)' }}>
                                                                        ✅ Fully Paid
                                                                    </div>
                                                                );
                                                            }
                                                            return <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#666' }}>✅ Account Clear</div>;
                                                            return null;
                                                        })()}
                                                    </div>
                                                    <div className="patient-stats">
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            <div style={{ color: '#888' }}>Vitals</div>
                                                            <strong>{patient.vitals.bp} | {patient.vitals.hr}</strong>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            <div style={{ color: '#888' }}>Recent Lab</div>
                                                            <strong>{Object.values(patient.recentLabs)[0]}</strong>
                                                        </div>
                                                        {patient.alerts.length > 0 && (
                                                            <span style={{ fontSize: '1.2rem' }} title={patient.alerts.join(', ')}>🚨</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* ChartHub Tab */}
                                {activeLabTab === 'charthub' && (
                                    <div className="charthub-grid">
                                        <Card>
                                            <div className="flex justify-between items-center mb-4">
                                                <h3>Patient Chart</h3>
                                                <div className="flex gap-2">
                                                    {selectedPatient.risks.includes('Readmission') && <Badge variant="error" size="lg">High Readmission Risk</Badge>}
                                                    {selectedPatient.risks.includes('Sepsis') && <Badge variant="warning" size="lg">Sepsis Watch</Badge>}
                                                </div>
                                            </div>
                                            <div className="grid gap-4 mb-6">
                                                <div className="p-4 bg-slate-50 rounded-lg flex items-center gap-4">
                                                    <div className="text-3xl">⚠️</div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-700">Clinical Alerts</h4>
                                                        {selectedPatient.alerts.length > 0 ? (
                                                            <ul className="list-disc pl-4 text-sm text-red-600">
                                                                {selectedPatient.alerts.map(a => <li key={a}>{a}</li>)}
                                                            </ul>
                                                        ) : <span className="text-sm text-green-600">No active alerts</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid gap-4 text-sm">
                                                <div><strong>Allergies:</strong> <span className={selectedPatient.allergies.length ? 'text-red-500' : 'text-green-500'}>{selectedPatient.allergies.join(', ') || 'NKDA'}</span></div>
                                                <div><strong>History:</strong> {selectedPatient.history}</div>
                                                <div><strong>Medications:</strong>
                                                    <ul className="list-disc pl-5 mt-2">
                                                        {selectedPatient.meds.map(m => <li key={m}>{m}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </Card>
                                        <Card>
                                            <h3 className="mb-4">Unified Care Plan & Records</h3>
                                            <div className="care-plan-box">
                                                <h4 className="text-sm text-navy mb-2">Current Care Plan</h4>
                                                <p className="text-sm m-0">{selectedPatient.carePlan}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Card className="bg-white p-4">
                                                    <h4 className="text-sm mb-2">Latest Imaging (PACS)</h4>
                                                    <div className="h-24 bg-black rounded flex items-center justify-center text-gray-400">[IMAGE VIEWPORT]</div>
                                                    <p className="text-xs mt-2 text-gray-500">Chest X-Ray - 2025-12-18</p>
                                                </Card>
                                                <Card className="bg-white p-4">
                                                    <h4 className="text-sm mb-2">Integrated Labs</h4>
                                                    <div className="lab-results-list">
                                                        {Object.entries(selectedPatient.recentLabs).map(([k, v]) => (
                                                            <div key={k} className="lab-result-item">
                                                                <span className="uppercase">{k}</span>
                                                                <strong>{v}</strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* Telehealth Tab */}
                                {activeLabTab === 'telehealth' && (
                                    <div className="telehealth-grid">
                                        <Card className="p-0 overflow-hidden bg-black text-white">
                                            <div className="video-container">
                                                <div className="text-center">
                                                    <p className="text-xl mb-6">Connecting to <strong>{selectedPatient.name}</strong>...</p>
                                                    <div className="flex gap-4 justify-center">
                                                        <Button
                                                            variant="success"
                                                            size="lg"
                                                            className="btn-video-action"
                                                            onClick={() => router.push(`/consultation/${selectedPatient.id}`)}
                                                        >
                                                            📹 Join Video Room
                                                        </Button>
                                                        <Button variant="danger" className="btn-video-round">⏹️</Button>
                                                    </div>
                                                </div>
                                                {/* Local Preview */}
                                                <div className="video-local-preview">[Self]</div>
                                            </div>
                                        </Card>
                                        <Card className="bg-white">
                                            <VitalsMonitor patient={selectedPatient} minimal={true} />
                                        </Card>
                                    </div>
                                )}

                                {/* Action Center Tab */}
                                {activeLabTab === 'action-center' && (
                                    <Card>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <h3>Orders & Prescriptions</h3>
                                            <DictationRecorder
                                                onSave={(note) => {
                                                    saveGlobalRecord({
                                                        pathNumber: selectedPatient.id,
                                                        fileName: 'Consultation Note (Dictated)',
                                                        unit: 'Clinical',
                                                        scientist: user.name,
                                                        professionalRole: 'DOCTOR',
                                                        structuredResults: {
                                                            testName: 'Dictated Consultation Note',
                                                            results: { note: note }
                                                        }
                                                    });
                                                    alert('Note saved to patient profile!');
                                                    fetchPatientRecords();
                                                }}
                                            />
                                        </div>

                                        {/* New Consultation Form */}
                                        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                            <h4 style={{ marginTop: 0, color: 'var(--color-primary-800)' }}>🩺 New Clinical Consultation</h4>
                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const formData = new FormData(e.target);
                                                const consultation = {
                                                    chiefComplaint: formData.get('chiefComplaint'),
                                                    hpi: formData.get('hpi'),
                                                    diagnosis: formData.get('diagnosis'),
                                                    treatmentPlan: formData.get('plan'),
                                                    followUp: formData.get('followUp'),
                                                    note: `Chief Complaint: ${formData.get('chiefComplaint')}\nDx: ${formData.get('diagnosis')}` // Summary for legacy views
                                                };

                                                try {
                                                    // Use saveGlobalRecord to persist to DB and Local (Hybrid)
                                                    // Or direct fetch if we want to bypass local. sticking to hybrid for safety.
                                                    await saveGlobalRecord({
                                                        pathNumber: selectedPatient.id,
                                                        fileName: `Consultation: ${consultation.diagnosis}`,
                                                        unit: 'Clinical',
                                                        scientist: user.name,
                                                        professionalRole: 'DOCTOR',
                                                        structuredResults: {
                                                            testName: 'Clinical Consultation',
                                                            results: consultation
                                                        }
                                                    });

                                                    alert('Consultation saved successfully!');
                                                    // e.target.reset(); // REMOVED: Keep form data per user request
                                                    fetchPatientRecords();
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Failed to save consultation');
                                                }
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Chief Complaint</label>
                                                        <input name="chiefComplaint" className="input" placeholder="e.g. Chest pain, difficulty breathing" required style={{ width: '100%', padding: '0.6rem' }} />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>History of Present Illness (HPI)</label>
                                                        <textarea name="hpi" className="input" rows="3" placeholder="Patient reports..." style={{ width: '100%', padding: '0.6rem' }}></textarea>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Diagnosis (ICD-10)</label>
                                                        <input name="diagnosis" className="input" placeholder="e.g. J20.9 Acute bronchitis" required style={{ width: '100%', padding: '0.6rem' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Follow-up</label>
                                                        <select name="followUp" className="input" style={{ width: '100%', padding: '0.6rem' }}>
                                                            <option value="PRN">PRN (As Needed)</option>
                                                            <option value="1 Week">1 Week</option>
                                                            <option value="1 Month">1 Month</option>
                                                            <option value="Referral">Refer to Specialist</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Treatment Plan</label>
                                                        <textarea name="plan" className="input" rows="3" placeholder="Medications, lifestyle changes, etc." required style={{ width: '100%', padding: '0.6rem' }}></textarea>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <button type="submit" className="btn btn-primary">Save Consultation</button>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="action-center-grid">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                {/* Previous Clinical Notes History */}
                                                <div className="card-section">
                                                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Previous Clinical Notes</h4>
                                                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.8rem' }}>
                                                        {patientRecords.filter(r => r.professionalRole === 'DOCTOR').length === 0 ? (
                                                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', margin: '0.5rem 0' }}>No previous consultations recorded.</p>
                                                        ) : (
                                                            patientRecords.filter(r => r.professionalRole === 'DOCTOR').map(rec => (
                                                                <div key={rec.id} style={{ marginBottom: '0.8rem', paddingBottom: '0.8rem', borderBottom: '1px solid #e1e7ef' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.3rem' }}>
                                                                        <span><strong>{new Date(rec.date).toLocaleDateString()}</strong> at {rec.time}</span>
                                                                        <span>{rec.professionalName}</span>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                                                                        {(() => {
                                                                            try {
                                                                                const data = typeof rec.structuredData === 'string' ? JSON.parse(rec.structuredData) : rec.structuredData;
                                                                                const results = data?.results || {};
                                                                                const history = results.medicalHistory ? `Dx: ${results.medicalHistory}` : '';
                                                                                const plan = results.treatmentPlan ? `Plan: ${results.treatmentPlan}` : '';
                                                                                return (
                                                                                    <div>
                                                                                        {history && <div style={{ marginBottom: '0.2rem' }}>{history}</div>}
                                                                                        {plan && <div>{plan}</div>}
                                                                                        {(!history && !plan) && <em style={{ color: '#94a3b8' }}>Check detailed record</em>}
                                                                                    </div>
                                                                                );
                                                                            } catch (e) { return <em style={{ color: '#94a3b8' }}>Error reading note</em>; }
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Medical History */}
                                                <div className="card-section">
                                                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Medical History</h4>
                                                    <textarea
                                                        className="input-field"
                                                        rows="3"
                                                        placeholder="Enter patient medical history..."
                                                        value={actionMedicalHistory}
                                                        onChange={(e) => setActionMedicalHistory(e.target.value)}
                                                        style={{ width: '100%', resize: 'vertical' }}
                                                    />
                                                </div>

                                                {/* Treatment Plan */}
                                                <div className="card-section">
                                                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Treatment Plan</h4>
                                                    <textarea
                                                        className="input-field"
                                                        rows="3"
                                                        placeholder="Outline the treatment plan..."
                                                        value={actionTreatmentPlan}
                                                        onChange={(e) => setActionTreatmentPlan(e.target.value)}
                                                        style={{ width: '100%', resize: 'vertical' }}
                                                    />
                                                </div>

                                                {/* Medications */}
                                                <div className="card-section">
                                                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Medications</h4>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                        <Input
                                                            type="text"
                                                            placeholder="Add new medication..."
                                                            value={actionMedication}
                                                            onChange={(e) => setActionMedication(e.target.value)}
                                                            style={{ margin: 0 }}
                                                            fullWidth
                                                        />
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => {
                                                                if (actionMedication.trim()) {
                                                                    setMedicationList(prev => [...prev, actionMedication.trim()]);
                                                                    setActionMedication('');
                                                                    alert(`Medication '${actionMedication}' added!`);
                                                                }
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                    <div className="table-responsive">
                                                        <table className="orders-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Current Medications</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {medicationList.map((med, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{med}</td>
                                                                        <td><Badge variant="success">Active</Badge></td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Review Activities */}
                                                <div className="card-section">
                                                    <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Review Activities</h4>
                                                    <textarea
                                                        className="input-field"
                                                        rows="3"
                                                        placeholder="Notes on review activities..."
                                                        value={actionReviewActivities}
                                                        onChange={(e) => setActionReviewActivities(e.target.value)}
                                                        style={{ width: '100%', resize: 'vertical' }}
                                                    />
                                                </div>

                                                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => {
                                                            saveGlobalRecord({
                                                                pathNumber: selectedPatient.id,
                                                                fileName: 'Clinical Action Note',
                                                                unit: 'Clinical',
                                                                scientist: user.name,
                                                                professionalRole: 'DOCTOR',
                                                                structuredResults: {
                                                                    testName: 'General Consultation Action',
                                                                    results: {
                                                                        medicalHistory: actionMedicalHistory,
                                                                        treatmentPlan: actionTreatmentPlan,
                                                                        medications: medicationList.join(', '), // Save full list
                                                                        reviewActivities: actionReviewActivities
                                                                    }
                                                                }
                                                            });
                                                            alert('Actions saved to patient record! Fields retained for further editing.');
                                                            // DO NOT CLEAR FIELDS per requirement
                                                        }}
                                                    >
                                                        💾 Save Clinical Actions
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <Card className="ai-card">
                                                    <h4 style={{ color: '#92400e', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🤖 AI Decision Support</h4>
                                                    <div style={{ fontSize: '0.85rem' }}>
                                                        {AI_SUGGESTIONS[selectedPatient.id]?.alerts.map(a => (
                                                            <div key={a} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                                <span>🚨</span> <strong>{a}</strong>
                                                            </div>
                                                        ))}
                                                        <div style={{ marginTop: '1rem', borderTop: '1px solid #fde68a', paddingTop: '1rem' }}>
                                                            <p style={{ fontWeight: 'bold' }}>Suggested Next Steps:</p>
                                                            <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                                                                {AI_SUGGESTIONS[selectedPatient.id]?.recommendations.map(r => <li key={r}>{r}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </Card>
                                                <Card className="guidelines-card">
                                                    <h4 style={{ color: '#3730a3', marginBottom: '0.8rem' }}>Guidelines (Pocket Guide)</h4>
                                                    <div style={{ fontSize: '0.8rem' }}>
                                                        <p><strong>HTN Management:</strong> Per ACC/AHA 2017 guidelines, aim for &lt;130/80.</p>
                                                        <p><strong>Heart Failure:</strong> Consider GDMT (ACEi/ARB, Beta-blocker).</p>
                                                    </div>
                                                </Card>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Calendar Tab */}
                                {activeLabTab === 'calendar' && (
                                    <Card>
                                        <h3>My Schedule</h3>
                                        {(() => {
                                            const { KEYS } = require('@/lib/global_sync');
                                            const allApps = typeof window !== 'undefined'
                                                ? JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]')
                                                : [];
                                            // Filter for this professional
                                            // In real app, we use `apiAppointments` fetched in useEffect
                                            const myApps = allApps; // .filter(a => a.professionalId === user.id) -- user.id might differ in mock

                                            const events = myApps.map(a => ({
                                                id: a.id,
                                                title: `${a.patientName} (${a.type})`,
                                                start: `${a.date}T${convertTo24Hour(a.time)}`,
                                                backgroundColor: a.type === 'Video' ? '#3b82f6' : '#10b981'
                                            }));

                                            function convertTo24Hour(timeStr) {
                                                // rudimentary conversion for "09:00 AM" -> "09:00:00"
                                                // Assuming Input is "HH:MM AM/PM"
                                                if (!timeStr) return '09:00:00';
                                                const [time, modifier] = timeStr.split(' ');
                                                let [hours, minutes] = time.split(':');
                                                if (hours === '12') hours = '00';
                                                if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
                                                return `${hours}:${minutes}:00`;
                                            }

                                            return (
                                                <CalendarView
                                                    events={events}
                                                    userRole={user.role}
                                                    onEventClick={(e) => alert(`Appointment: ${e.title}`)}
                                                />
                                            )
                                        })()}
                                    </Card>
                                )}

                                {/* Analytics Tab */}
                                {activeLabTab === 'analytics' && (
                                    <Card>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3>Health Trends & Predictive Risk</h3>
                                            <select
                                                className="input-field w-auto"
                                                value={selectedPatientId}
                                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                                style={{ maxWidth: '300px' }}
                                            >
                                                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                                            {/* The New AI Widget */}
                                            <AnalyticsWidget patientId={selectedPatient.id} />

                                            <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                                                <h4 style={{ marginBottom: '1rem' }}>Overall Risk Score</h4>
                                                <div className="risk-score-circle" style={{
                                                    borderTopColor: selectedPatient.triage?.level === 'CRITICAL' ? 'red' : (selectedPatient.triage?.level === 'URGENT' ? 'orange' : 'green'),
                                                    width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #f0f0f0', borderTop: '8px solid var(--color-primary-500)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold'
                                                }}>
                                                    {selectedPatient.triage?.score || 0}/10
                                                </div>
                                                <div className="mt-4">
                                                    <Badge variant={selectedPatient.triage?.level === 'CRITICAL' ? 'error' : (selectedPatient.triage?.level === 'URGENT' ? 'warning' : 'success')}>
                                                        {selectedPatient.triage?.level || 'STABLE'}
                                                    </Badge>
                                                </div>
                                                <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
                                                    {selectedPatient.triage?.reason || 'No current risk factors identified.'}
                                                </p>
                                            </Card>
                                        </div>
                                    </Card>
                                )}
                            </>
                        )}

                        {/* Communication Hub Tab - Doctor View */}
                        {/* Communication Hub Tab - Doctor View */}
                        {activeLabTab === 'communication' && (
                            <CommunicationHub
                                user={user}
                                patients={patients}
                                initialPatientId={selectedPatientId}
                                onPatientSelect={(p) => setSelectedPatientId(p.id)}
                            />
                        )}

                        {/* Engagement Tab */}
                        {
                            activeLabTab === 'engagement' && (
                                <EngagementTab
                                    user={user}
                                    patients={patients}
                                    selectedPatientId={selectedPatientId}
                                    setSelectedPatientId={setSelectedPatientId}
                                />
                            )
                        }

                        {/* Collaboration Tab */}
                        {
                            activeLabTab === 'collaboration' && (
                                <CollaborationTab user={user} selectedPatientId={selectedPatientId} />
                            )
                        }

                        {/* Tasks Tab */}
                        {/* Tasks Tab */}
                        {
                            activeLabTab === 'tasks' && (
                                <Card>
                                    <h3>Task Management & Reminders</h3>
                                    <div className="tasks-grid">
                                        <div>
                                            <h4 style={{ marginBottom: '1rem' }}>Pending Follow-Ups</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <Card className="task-card">
                                                    <div>
                                                        <strong>Review Labs: Robert Brown</strong>
                                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Due Today, 5:00 PM</div>
                                                    </div>
                                                    <Button variant="secondary" size="sm">Done</Button>
                                                </Card>
                                                <Card className="task-card">
                                                    <div>
                                                        <strong>Sign Referral: Jane Smith</strong>
                                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Due Tomorrow</div>
                                                    </div>
                                                    <Button variant="secondary" size="sm">Done</Button>
                                                </Card>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ marginBottom: '1rem' }}>Critical Result Alerts</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                {CLINICAL_ALERTS.map(alert => (
                                                    <div key={alert.message} className={`clinical-alert ${alert.type === 'critical' ? 'critical' : 'normal'}`}>
                                                        <strong>{alert.message}</strong>
                                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>{alert.time}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )
                        }

                        {/* Patient Engagement Tab */}
                        {/* Patient Engagement Tab */}
                        {
                            activeLabTab === 'engagement' && (
                                <Card>
                                    <h3>Patient Engagement Tools</h3>
                                    <div className="engagement-grid">
                                        <div>
                                            <h4 style={{ marginBottom: '1rem' }}>Educational Resources</h4>
                                            <div style={{ display: 'grid', gap: '0.8rem' }}>
                                                <div className="resource-item">
                                                    <span>Low Sodium Diet Guide (PDF)</span>
                                                    <Button variant="primary" size="sm">Send to Patient</Button>
                                                </div>
                                                <div className="resource-item">
                                                    <span>Coping with Chronic Illness (Video)</span>
                                                    <Button variant="primary" size="sm">Send to Patient</Button>
                                                </div>
                                                <div className="resource-item">
                                                    <span>Diabetes Management 101</span>
                                                    <Button variant="primary" size="sm">Send to Patient</Button>
                                                </div>
                                            </div>
                                        </div>
                                        <Card style={{ background: '#f8fafc' }}>
                                            <h4 style={{ marginBottom: '1rem' }}>Patient Portal Inbox (Questions/Symptoms)</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <div className="portal-msg">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                        <strong>From: {selectedPatient.name}</strong>
                                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>2 hours ago</span>
                                                    </div>
                                                    <p style={{ fontSize: '0.9rem', margin: 0 }}>"Doctor, I've been feeling a bit more short of breath since this morning. Should I increase my Albuterol?"</p>
                                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                        <Button variant="secondary" size="sm">Reply</Button>
                                                        <Button variant="secondary" size="sm">Schedule Visit</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </Card>
                            )
                        }

                        {/* Patient Records Tab */}
                        {
                            activeLabTab === 'patient-records' && (
                                <div>
                                    <PatientRecordFinder
                                        title="Patient Medical Records"
                                        description="Search for any patient by PATH number to view their complete medical history, lab results, and clinical notes."
                                        user={user}
                                        patients={patients}
                                    />
                                </div>
                            )
                        }

                        {/* Alerts Tab */}
                        {
                            activeLabTab === 'alerts' && (
                                <AlertsView professionalName={user.name} role={user.role} professionalId={user.id} />
                            )
                        }
                    </div >
                ) : (
                    <>
                        {activeLabTab === 'collaboration' ? (
                            <CollaborationTab user={user} selectedPatientId={selectedPatientId} />
                        ) : activeLabTab === 'alerts' ? (
                            <AlertsView professionalName={user.name} role={user.role} professionalId={user.id} />
                        ) : activeLabTab === 'patient-records' ? (
                            <Card>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h3>Clinical Summary: {selectedPatient ? selectedPatient.name : 'Select Patient'}</h3>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <PatientAutofillInputs
                                                patientName={selectedPatientName}
                                                setPatientName={setSelectedPatientName}
                                                patientId={selectedPatientId || ''}
                                                setPatientId={setSelectedPatientId}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {selectedPatient && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                        {/* Vitals */}
                                        <div className="card-section">
                                            <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Latest Vitals</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                                <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>BP</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedPatient.vitals.bp}</div>
                                                </div>
                                                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>Heart Rate</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedPatient.vitals.hr}</div>
                                                </div>
                                                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#1e40af' }}>SpO2</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedPatient.vitals.spo2}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Diagnosis */}
                                        <div className="card-section">
                                            <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Active Diagnosis & History</h4>
                                            <div className="p-3 bg-slate-50 border rounded min-h-[100px]">
                                                {selectedPatient.activeIssues.map((issue, idx) => (
                                                    <div key={idx} style={{ marginBottom: '0.5rem' }}>• {issue}</div>
                                                ))}
                                                {selectedPatient.history && <div style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>Hx: {selectedPatient.history}</div>}
                                            </div>
                                        </div>

                                        {/* Medications */}
                                        <div className="card-section">
                                            <h4 style={{ fontSize: '1rem', color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>Current Medications</h4>
                                            <div className="p-3 bg-slate-50 border rounded min-h-[100px]">
                                                {medicationList.length > 0 ? (
                                                    medicationList.map((med, idx) => (
                                                        <div key={idx} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>💊 {med}</span>
                                                            <Badge variant="success" size="sm">Active</Badge>
                                                        </div>
                                                    ))
                                                ) : <span style={{ color: '#999' }}>No active medications listed.</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ) : activeLabTab === 'communication' ? (
                            <CommunicationHub
                                user={user}
                                patients={patients}
                                initialPatientId={selectedPatientId}
                                onPatientSelect={(p) => setSelectedPatientId(p.id)}
                            />
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div style={{ position: 'relative', minWidth: '250px' }}>
                                        <Input
                                            type="text"
                                            placeholder="🔍 Enter Patient Path No..."
                                            value={pathSearch}
                                            onChange={(e) => setPathSearch(e.target.value)}
                                            style={{ borderColor: pathSearch ? 'var(--color-sea-blue)' : '#ddd' }}
                                            fullWidth
                                        />
                                        {pathSearch && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--color-sea-blue)', fontWeight: 'bold' }}>ACTIVE PATIENT</span>}
                                    </div>

                                    {isScientist && selectedPatient && (
                                        <div style={{ display: 'flex', background: '#e0f2fe', padding: '0.25rem', borderRadius: '8px' }}>
                                            <button
                                                onClick={() => { setActiveLabView('entry'); fetchPatientRecords(); }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: activeLabView === 'entry' ? '#fff' : 'transparent',
                                                    color: activeLabView === 'entry' ? 'var(--color-navy)' : '#64748b',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    boxShadow: activeLabView === 'entry' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            >
                                                + New Entry
                                            </button>
                                            <button
                                                onClick={() => { setActiveLabView('history'); fetchPatientRecords(); }}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: activeLabView === 'history' ? '#fff' : 'transparent',
                                                    color: activeLabView === 'history' ? 'var(--color-navy)' : '#64748b',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    boxShadow: activeLabView === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                                }}
                                            >
                                                History / Manage
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Card style={{ background: '#fcfcfc', border: '1px solid #eee' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}>
                                                {isScientist ? `${labUnits.find(u => u.id === activeLabTab)?.icon || ''} ${labUnits.find(u => u.id === activeLabTab)?.name || 'Lab'} Unit` : `🏢 Clinical Workspace: ${user.role}`}
                                            </h3>
                                            <p style={{ color: '#666', fontSize: '0.9rem' }}>
                                                {isScientist ? 'Select a test category to enter structured results or upload a manual report.' : 'Access digital clinical tools to record patient encounters and prescriptions.'}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {isScientist && <Button onClick={() => handleAction('Upload')} variant="secondary" size="sm">📤 Upload File</Button>}
                                            <Button onClick={() => handleAction('Dispatch')} variant="primary" size="sm" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>🚀 Dispatch Final</Button>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        {activeLabView === 'history' ? (
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' }}>Managable Records ({patientRecords.length})</h4>
                                                {patientRecords.length === 0 ? (
                                                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                                                        No records found for this patient.
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'grid', gap: '0.8rem' }}>
                                                        {patientRecords.map(rec => (
                                                            <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                                <div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                                                                        <strong style={{ color: 'var(--color-navy)' }}>{rec.fileName}</strong>
                                                                        <Badge variant="neutral" size="sm">{rec.customId || `ID: ${rec.id.substring(0, 6)}...`}</Badge>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', marginLeft: '1.7rem' }}>
                                                                        Dispatched by <strong>{rec.professionalName}</strong> on {rec.date} at {rec.time}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    onClick={() => deleteRecord(rec.id)}
                                                                    variant="danger"
                                                                    size="sm"
                                                                    style={{ background: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1rem' }}
                                                                >
                                                                    🗑️ Delete Result
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <h4 style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase', marginBottom: '1rem' }}>Available Modules</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
                                                    {/* Custom Manual Entry Button */}
                                                    <Button
                                                        onClick={() => {
                                                            setActiveTest('MANUAL_ENTRY');
                                                            setTestResults({});
                                                            setManualEntry({ testName: '', resultValue: '', unit: '', normalRange: '', flag: '', notes: '' });
                                                        }}
                                                        variant={activeTest === 'MANUAL_ENTRY' ? 'primary' : 'secondary'}
                                                        style={{ justifyContent: 'flex-start', fontSize: '0.8rem', border: '1px dashed var(--color-primary-500)' }}
                                                    >
                                                        <span style={{ marginRight: '0.5rem' }}>✍️</span>
                                                        Manual / Ad-hoc Entry
                                                    </Button>

                                                    {(isScientist ? LAB_TESTS[activeLabTab] : CLINICAL_MODULES[user.role])?.map(test => (
                                                        <Button
                                                            key={test.id}
                                                            onClick={() => {
                                                                setActiveTest(test.id);
                                                                const defaults = {};
                                                                test.parameters.forEach(p => defaults[p.id] = p.default || '');
                                                                setTestResults(defaults);
                                                            }}
                                                            variant={activeTest === test.id ? 'primary' : 'secondary'}
                                                            style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }}
                                                        >
                                                            {test.icon && <span style={{ marginRight: '0.5rem' }}>{test.icon}</span>}
                                                            {test.name}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Manual Entry Form */}
                                    {activeTest === 'MANUAL_ENTRY' && (
                                        <Card style={{ background: '#fff', border: '2px solid var(--color-sea-blue)', animation: 'fadeIn 0.4s' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                <h3 style={{ margin: 0 }}>✍️ Manual Lab Result Entry</h3>
                                                <Button onClick={() => setActiveTest(null)} variant="secondary" size="sm">Cancel</Button>
                                            </div>
                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const manualData = manualEntry;

                                                try {
                                                    await saveGlobalRecord({
                                                        pathNumber: selectedPatient.id,
                                                        fileName: manualData.testName,
                                                        unit: labUnits.find(u => u.id === activeLabTab)?.name || 'General Lab',
                                                        unitId: activeLabTab,
                                                        scientist: user.name,
                                                        professionalRole: 'SCIENTIST',
                                                        structuredResults: {
                                                            testId: 'MANUAL',
                                                            testName: manualData.testName,
                                                            results: {
                                                                value: manualData.resultValue,
                                                                unit: manualData.unit,
                                                                flag: manualData.flag
                                                            },
                                                            metadata: {
                                                                unit: manualData.unit,
                                                                range: manualData.normalRange
                                                            },
                                                            notes: manualData.notes
                                                        }
                                                    });
                                                    alert('Manual result saved successfully!');
                                                    // e.target.reset(); // REMOVED: Keep form data per user request
                                                    fetchPatientRecords();
                                                    // setActiveTest(null); // REMOVED: Keep form open
                                                } catch (err) {
                                                    alert('Failed to save result: ' + err.message);
                                                }
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Test Name</label>
                                                        <Input name="testName" value={manualEntry.testName} onChange={handleManualChange} placeholder="e.g. Hemoglobin, Glucose, ALT" required fullWidth />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Result Value</label>
                                                        <Input name="resultValue" value={manualEntry.resultValue} onChange={handleManualChange} placeholder="e.g. 150" required fullWidth />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Unit</label>
                                                        <Input name="unit" value={manualEntry.unit} onChange={handleManualChange} placeholder="e.g. g/dL" required fullWidth />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Reference Range</label>
                                                        <Input name="normalRange" value={manualEntry.normalRange} onChange={handleManualChange} placeholder="e.g. 13.5 - 17.5" fullWidth />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Flag</label>
                                                        <select name="flag" value={manualEntry.flag} onChange={handleManualChange} className="input" style={{ width: '100%' }}>
                                                            <option value="">None</option>
                                                            <option value="Normal">Normal</option>
                                                            <option value="Low">Low</option>
                                                            <option value="High">High</option>
                                                            <option value="Critical Low">Critical Low</option>
                                                            <option value="Critical High">Critical High</option>
                                                            <option value="Abnormal">Abnormal</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Notes / Comments</label>
                                                        <textarea name="notes" value={manualEntry.notes} onChange={handleManualChange} className="input" placeholder="Clinical validation notes..." style={{ width: '100%', minHeight: '80px' }} />
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                                    <Button type="button" onClick={() => setActiveTest(null)} variant="secondary">Cancel</Button>
                                                    <Button type="submit" variant="primary">Submit Record</Button>
                                                </div>
                                            </form>
                                        </Card>
                                    )}

                                    {activeTest && (
                                        <Card style={{ background: '#fff', border: '2px solid var(--color-sea-blue)', animation: 'fadeIn 0.4s' }}>
                                            {(() => {
                                                const testSource = isScientist ? LAB_TESTS[activeLabTab] : CLINICAL_MODULES[user.role];
                                                const currentTestData = testSource.find(t => t.id === activeTest);
                                                return (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                                            <h3 style={{ margin: 0 }}>{currentTestData?.icon} {currentTestData?.name}</h3>
                                                            <Button onClick={() => setActiveTest(null)} variant="secondary" size="sm">Cancel</Button>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    // Dispatch Logic
                                                                    // Construct Metadata
                                                                    const metadata = {};
                                                                    currentTestData?.parameters.forEach(param => {
                                                                        let refRange = param.range;
                                                                        if (param.getRange && selectedPatient) {
                                                                            const age = selectedPatient.age ? parseInt(selectedPatient.age) : 30;
                                                                            const sex = selectedPatient.sex || 'Male';
                                                                            refRange = param.getRange(age, sex);
                                                                        }
                                                                        metadata[param.id] = {
                                                                            unit: param.unit || '',
                                                                            range: refRange || ''
                                                                        };
                                                                    });

                                                                    try {
                                                                        await saveGlobalRecord({
                                                                            pathNumber: selectedPatient.id,
                                                                            fileName: currentTestData?.name || 'Lab Result',
                                                                            unit: isScientist ? labUnits.find(u => u.id === activeLabTab)?.name : user.role,
                                                                            unitId: activeLabTab,
                                                                            scientist: user.name,
                                                                            professionalRole: isScientist ? 'SCIENTIST' : user.role, // Explicitly set role
                                                                            structuredResults: {
                                                                                testId: activeTest,
                                                                                testName: currentTestData?.name,
                                                                                results: testResults,
                                                                                metadata: metadata
                                                                            }
                                                                        });

                                                                        alert(`Results for ${currentTestData?.name} dispatched to patient record!`);
                                                                        // setActiveTest(null); // REMOVED: Keep form open and filled
                                                                        // setTestResults({}); // REMOVED: Keep data
                                                                    } catch (err) {
                                                                        alert(`Dispatch Failed: ${err.message}`);
                                                                    }
                                                                }}
                                                                style={{
                                                                    marginLeft: '0.5rem',
                                                                    backgroundColor: '#2563eb',
                                                                    color: 'white',
                                                                    padding: '0.75rem 1.5rem',
                                                                    fontWeight: 'bold',
                                                                    borderRadius: '6px',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                                }}
                                                            >
                                                                Dispatch Final
                                                            </Button>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                            {currentTestData?.parameters.map(param => {
                                                                // Calculate Reference Range based on Patient Demographics
                                                                let referenceRange = param.range;
                                                                if (param.getRange && selectedPatient) {
                                                                    // Extract age and sex
                                                                    const age = selectedPatient.age ? parseInt(selectedPatient.age) : 30; // Default to adult if missing
                                                                    const sex = selectedPatient.sex || 'Male';
                                                                    referenceRange = param.getRange(age, sex);
                                                                }

                                                                return (
                                                                    <div key={param.id} style={{ gridColumn: param.type === 'textarea' ? 'span 2' : 'auto' }}>
                                                                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                            <span>
                                                                                {param.label} {param.unit && <span style={{ color: '#666', fontWeight: 'normal' }}>({param.unit})</span>}
                                                                            </span>
                                                                            {referenceRange && (
                                                                                <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 'normal', background: '#dcfce7', padding: '0 0.4rem', borderRadius: '4px' }}>
                                                                                    Ref: {referenceRange}
                                                                                </span>
                                                                            )}
                                                                        </label>
                                                                        {param.type === 'textarea' ? (
                                                                            <textarea
                                                                                className="input-field"
                                                                                value={testResults[param.id] || ''}
                                                                                onChange={(e) => setTestResults(prev => ({ ...prev, [param.id]: e.target.value }))}
                                                                                style={{ height: '100px', resize: 'vertical' }}
                                                                            />
                                                                        ) : (
                                                                            <Input
                                                                                type="text"
                                                                                value={testResults[param.id] || ''}
                                                                                onChange={(e) => setTestResults(prev => {
                                                                                    // Save metadata automatically when value changes? 
                                                                                    // Actually we need to construct the full metadata object on Dispatch.
                                                                                    // Here we just update the value state.
                                                                                    return { ...prev, [param.id]: e.target.value };
                                                                                })}
                                                                                style={{ marginBottom: 0 }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Click "Dispatch Final" above to save clinical data.</p>
                                            </div>
                                        </Card>
                                    )}

                                    {!activeTest && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {/* Dynamic Appointment Logic */}
                                            {(() => {
                                                // [NEW] Use API data instead of LocalStorage
                                                const allApps = apiAppointments.length > 0 ? apiAppointments : getGlobalData(KEYS.APPOINTMENTS, []);
                                                const allDispatched = getGlobalData(KEYS.RECORDS, []);

                                                // Get local YYYY-MM-DD for "Today"
                                                const today = new Date();
                                                const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

                                                // Filter for Current User & Today
                                                const myAppointmentsToday = allApps.filter(a => {
                                                    if (!a || !a.date) return false;

                                                    const matchUser = (a.professionalId === user.id || a.professionalName === user.name);
                                                    if (!matchUser) return false;

                                                    // Simple, safe string comparison fallback if date object fails
                                                    try {
                                                        const appDate = new Date(a.date);
                                                        const now = new Date();
                                                        return appDate.toDateString() === now.toDateString();
                                                    } catch (e) {
                                                        // Fallback to string match
                                                        const appDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
                                                        const todayStr = new Date().toISOString().split('T')[0];
                                                        return appDateStr === todayStr;
                                                    }
                                                });

                                                // Filter Pending (Appointments without a dispatched record for this patient today)
                                                // Note: Ideally match by specific request ID, but for now matching Patient + Date is sufficient proxy.
                                                const pendingList = myAppointmentsToday.filter(app => {
                                                    const hasRecord = allDispatched.some(rec =>
                                                        (rec.pathNumber === app.patientId || rec.patientName === app.patientName) &&
                                                        rec.date === new Date().toLocaleDateString() // Record saves readable date, app uses ISO YYYY-MM-DD. Need robust check.
                                                        // Actually saveGlobalRecord uses new Date().toLocaleString() for 'date' field in some places or 'timestamp'.
                                                        // Let's check saveGlobalRecord implementation... it adds `date: new Date().toLocaleDateString()`.
                                                        // So we should compare `new Date().toLocaleDateString()` with `new Date(app.date).toLocaleDateString()`.
                                                    );
                                                    // Also check if we already have it in patientRecords state if loaded? 
                                                    // Better to trust global records store.

                                                    // Normalize dates for comparison
                                                    // App Date: YYYY-MM-DD
                                                    // Record Date: M/D/YYYY (Locale string)

                                                    // Simplification: Check if record exists created TODAY for this patient by this scientist
                                                    // or just for this patient if we assume one test per day.

                                                    const [y, m, d] = app.date.split('-').map(Number);
                                                    const appDateObj = new Date(y, m - 1, d);
                                                    const recsForPatient = allDispatched.filter(r => r.pathNumber === app.patientId);

                                                    // Check if any record matches today's date
                                                    const isDone = recsForPatient.some(r => {
                                                        const rDate = new Date(r.timestamp || r.date); // timestamp is ISO, date is locale
                                                        return rDate.toDateString() === appDateObj.toDateString();
                                                    });

                                                    return !isDone;
                                                });

                                                return (
                                                    <>
                                                        <Card style={{ background: 'white', border: '1px solid #eee', padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                                                📅 Today's Appointments
                                                                <Badge variant="neutral">{myAppointmentsToday.length}</Badge>
                                                            </h4>
                                                            {myAppointmentsToday.length === 0 ? (
                                                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.5rem' }}>No appointments scheduled.</p>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                                                    {myAppointmentsToday.map(app => (
                                                                        <div key={app.id}
                                                                            style={{ padding: '0.5rem', background: '#f0f9ff', borderLeft: '3px solid #0ea5e9', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                                                                            onClick={() => {
                                                                                setPathSearch(app.patientId);
                                                                                // Auto-fetch records when clicked
                                                                                // We can't easily call fetchPatientRecords here as it depends on state that updates on next render.
                                                                                // But setting pathSearch will let user hit Enter or we can try to auto-select.
                                                                            }}
                                                                        >
                                                                            <strong>{app.patientName}</strong> <br />
                                                                            <span style={{ color: '#64748b' }}>{app.time} • {app.patientId}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </Card>

                                                        <Card style={{ background: 'white', border: '1px solid #eee', padding: '1rem' }}>
                                                            <h4 style={{ fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                                                                📋 Pending Reports
                                                                <Badge variant={pendingList.length > 0 ? 'warning' : 'success'}>{pendingList.length}</Badge>
                                                            </h4>
                                                            {pendingList.length === 0 ? (
                                                                <div style={{ marginTop: '0.5rem', color: '#16a34a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span>✅</span> All caught up!
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                                                                    {pendingList.map(app => (
                                                                        <div key={app.id} style={{ padding: '0.5rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                                            <strong>{app.patientName}</strong>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                                                                                <span style={{ color: '#b45309' }}>Waiting for Results</span>
                                                                                <button
                                                                                    style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}
                                                                                    onClick={() => {
                                                                                        setPathSearch(app.patientId);
                                                                                        // Optional: Auto-select test based on appointment type if available
                                                                                    }}
                                                                                >
                                                                                    Process
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </Card>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </Card>

                                <Card style={{ marginTop: '2rem', borderTop: '4px solid var(--color-sea-blue)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}>📊 Lab File Inventory & Validation</h3>
                                            <p style={{ color: '#666', fontSize: '0.85rem' }}>Review, confirm, or delete uploaded results from all units.</p>
                                        </div>
                                        <Badge variant="neutral">
                                            {uploadedFiles.length} Total Files
                                        </Badge>
                                    </div>

                                    {uploadedFiles.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '3rem', background: '#fcfcfc', borderRadius: '8px', border: '1px dashed #ddd' }}>
                                            <p style={{ color: '#999' }}>No files uploaded yet. Start by selecting a unit and clicking "Upload Results".</p>
                                        </div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                                <thead>
                                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                                                        <th style={{ padding: '0.8rem', fontSize: '0.9rem' }}>File Name</th>
                                                        <th style={{ padding: '0.8rem', fontSize: '0.9rem' }}>Unit</th>
                                                        <th style={{ padding: '0.8rem', fontSize: '0.9rem' }}>Date Uploaded</th>
                                                        <th style={{ padding: '0.8rem', fontSize: '0.9rem' }}>Status</th>
                                                        <th style={{ padding: '0.8rem', fontSize: '0.9rem', textAlign: 'right' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {uploadedFiles.map(file => (
                                                        <tr key={file.id} style={{ borderBottom: '1px solid #eee' }}>
                                                            <td style={{ padding: '0.8rem' }}><strong>{file.name}</strong></td>
                                                            <td style={{ padding: '0.8rem' }}><span style={{ fontSize: '0.85rem', color: '#666' }}>{file.unit}</span></td>
                                                            <td style={{ padding: '0.8rem', fontSize: '0.85rem' }}>{file.timestamp}</td>
                                                            <td style={{ padding: '0.8rem' }}>
                                                                <Badge variant={file.status === 'Confirmed' ? 'success' : 'warning'}>
                                                                    {file.status}
                                                                </Badge>
                                                            </td>
                                                            <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                                    {file.status !== 'Confirmed' && (
                                                                        <Button onClick={() => handleConfirmFile(file.id)} variant="primary" size="sm" style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>Confirm</Button>
                                                                    )}
                                                                    <Button onClick={() => handleDeleteFile(file.id)} variant="danger" size="sm">Delete</Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>
                            </>
                        )}
                    </>
                )}
            </>
        </DashboardLayout >
    );
}

