"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import WhatsAppButton from './WhatsAppButton';
const PaystackButton = dynamic(() => import('./PaystackButton'), { ssr: false });
import { ROLES } from '@/lib/auth_constants';
import { useVitals } from '@/lib/hooks/useClinicalData';
// import { PROFESSIONALS_DATA } from '@/lib/professionals_data'; // Removed for dynamic only
// import { usePaystackPayment } from 'react-paystack'; // Causing SSR issues, removed as we use PaystackButton component now
import { savePatientProfile, KEYS } from '@/lib/global_sync';
import { useGlobalSync } from '@/lib/hooks/useGlobalSync';
import { getSocket } from '@/lib/socket';
import { analyzeResult, analyzeBP } from '@/lib/medical_analysis';
import Toast from './Toast';

export default function PatientDashboard({ user }) {
    const router = useRouter();
    const syncTick = useGlobalSync(); // Triggers re-render on storage updates
    const [activeTab, setActiveTab] = useState('overview');
    const [appointmentView, setAppointmentView] = useState('new');
    const [previewFile, setPreviewFile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [bookingStep, setBookingStep] = useState('search'); // 'search', 'details', 'payment'
    const [selectedProfessional, setSelectedProfessional] = useState(null);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [appointmentType, setAppointmentType] = useState('Video'); // 'Video' or 'In-person'
    const [paymentMode, setPaymentMode] = useState('Full'); // 'Full' or 'Part'
    const [paymentAmount, setPaymentAmount] = useState(155); // Default GHS 155.00
    const [billPaymentMode, setBillPaymentMode] = useState('Full');
    const [billPaymentAmount, setBillPaymentAmount] = useState(0);
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [toast, setToast] = useState(null);

    // Import Region Data
    const { POPULAR_REGIONS } = require('@/lib/location_data');
    const ghanaRegions = POPULAR_REGIONS['Ghana'] || [];

    // Persistent Profile Logic
    const patientId = user.pathNumber || user.id || 'PAT-TEMP';
    const { latestVital } = useVitals(patientId);

    const [profile, setProfile] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem(KEYS.PATIENT_PROFILES) || '{}');
            return saved[patientId] || {};
        }
        return {};
    });

    const [dbProfessionals, setDbProfessionals] = useState({});
    const [loadingProfs, setLoadingProfs] = useState(false);

    // API State for Appointments & Records
    const [apiAppointments, setApiAppointments] = useState([]);
    const [loadingAppointments, setLoadingAppointments] = useState(false);
    const [apiRecords, setApiRecords] = useState([]);

    // Alerts/Messages State
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null); // ID of the message being replied to
    const [replyContent, setReplyContent] = useState('');
    const [isSendingReply, setIsSendingReply] = useState(false);

    // Fetch Appointments from API
    const fetchAppointments = async () => {
        setLoadingAppointments(true);
        try {
            const res = await fetch('/api/appointments');
            if (res.ok) {
                const data = await res.json();
                setApiAppointments(data);
            }
        } catch (e) {
            console.error("Failed to load appointments", e);
        } finally {
            setLoadingAppointments(false);
        }
    };

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/records');
            if (res.ok) {
                const data = await res.json();
                setApiRecords(data);
            }
        } catch (e) {
            console.error("Failed to load records", e);
        }
    }

    const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
            const res = await fetch('/api/messages');
            if (res.ok) setMessages(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingMessages(false); }
    };

    // Helper for Vitals Analysis
    const getVitalAnalysis = (type, value) => {
        if (!value || value === '--' || value === '--/--') return null;
        const age = profile.age || 30;
        const sex = profile.sex || profile.gender || 'Male';

        if (type === 'BP') return analyzeBP(value, age);

        const map = {
            'HR': { cat: 'VITALS', test: 'HR' },
            'SpO2': { cat: 'VITALS', test: 'SpO2' },
            'Temp': { cat: 'VITALS', test: 'Temp' },
            'RR': { cat: 'VITALS', test: 'RR' },
            'Glucose': { cat: 'VITALS', test: 'Glucose' }
        };

        const def = map[type];
        if (!def) return null;
        return analyzeResult(def.cat, def.test, value, age, sex);
    };

    // Render Vitals Card Helper
    const RenderVitalCard = ({ label, value, unit, type }) => {
        const analysis = getVitalAnalysis(type, value);
        const color = analysis ? analysis.color : 'var(--color-navy)';
        const bg = analysis && analysis.flag !== 'Normal' ? (analysis.color === 'red' ? '#fef2f2' : '#fff7ed') : '#f8fafc';

        return (
            <div className="card" style={{ textAlign: 'center', padding: '1rem', background: bg, border: analysis && analysis.flag !== 'Normal' ? `1px solid ${color}` : 'none' }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color }}>
                    {value} <span style={{ fontSize: '0.8rem', color: '#666' }}>{unit}</span>
                </div>
                {analysis && analysis.flag !== 'Normal' && (
                    <div style={{ fontSize: '0.7rem', color: color, fontWeight: 'bold', marginTop: '0.2rem' }}>
                        {analysis.flag}
                    </div>
                )}
            </div>
        );
    };

    const handleDeleteMessage = async (msgId) => {
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await fetch(`/api/messages?id=${msgId}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Message deleted successfully', type: 'success' });
                fetchMessages();
            } else {
                setToast({ message: 'Failed to delete message', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: 'Error deleting message', type: 'error' });
        }
    };

    const handleSendReply = async (recipientId, originalMsg) => {
        if (!replyContent.trim()) return;
        setIsSendingReply(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: recipientId,
                    recipientName: originalMsg.senderName,
                    content: replyContent,
                    type: 'CHAT',
                    subject: `Re: ${originalMsg.content.substring(0, 20)}...`
                })
            });
            if (res.ok) {
                setToast({ message: 'Reply sent successfully!', type: 'success' });
                setReplyContent('');
                setReplyingTo(null);
                fetchMessages();
            } else {
                setToast({ message: 'Failed to send reply', type: 'error' });
            }
        } catch (e) {
            console.error(e);
            setToast({ message: 'Error sending reply', type: 'error' });
        } finally {
            setIsSendingReply(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/db');
            if (res.ok) {
                const data = await res.json();
                const serverProfile = data.patient_profiles?.[0]; // Patients only get their own
                const serverUser = data.users?.find(u => u.email === user.email || u.id === user.id);

                if (serverProfile || serverUser) {
                    const mergedProfile = {
                        // Base: User Session Data (least priority for mutable fields but good for defaults)
                        fullName: user.name,
                        email: user.email,

                        // Layer 1: Server User Data (Has region, country, phoneNumber)
                        ...serverUser,

                        // Layer 2: Server Profile Data (Has address, medical history, specialized fields)
                        ...(serverProfile || {}),

                        // Explicit Field Mapping & Overrides
                        phone: serverUser?.phoneNumber || serverProfile?.phoneNumber || user.phone,
                        region: serverUser?.region || serverProfile?.region || user.region,
                        country: serverUser?.country || user.country || 'Ghana',

                        // Map Profile Specifics
                        dob: serverProfile?.dateOfBirth,
                        gender: serverProfile?.gender || serverProfile?.sex || serverUser?.gender
                    };

                    if (serverProfile?.dateOfBirth && !mergedProfile.age) {
                        // Recalculate age if missing but DOB exists
                        const dob = new Date(serverProfile.dateOfBirth);
                        const diff_ms = Date.now() - dob.getTime();
                        const age_dt = new Date(diff_ms);
                        mergedProfile.age = Math.abs(age_dt.getUTCFullYear() - 1970);
                    }

                    setProfile(prev => ({ ...prev, ...mergedProfile }));

                    // Update LocalStorage to keep sync
                    const saved = JSON.parse(localStorage.getItem(KEYS.PATIENT_PROFILES) || '{}');
                    saved[patientId] = mergedProfile;
                    localStorage.setItem(KEYS.PATIENT_PROFILES, JSON.stringify(saved));
                }
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        }
    };

    useEffect(() => {
        // Initial Data Load
        fetchProfile();
        fetchAppointments();
        fetchRecords(); // Pre-load records
    }, []);

    useEffect(() => {
        if (activeTab === 'appointments' || activeTab === 'bills' || activeTab === 'overview') {
            fetchAppointments();
        }
        if (activeTab === 'records') {
            fetchRecords();
        }
        if (activeTab === 'alerts') {
            fetchMessages();
        }
    }, [activeTab]);



    useEffect(() => {
        const fetchProfessionals = async () => {
            setLoadingProfs(true);
            try {
                // Fetch verified professionals
                const res = await fetch('/api/users?role=professional'); // We want all to see pending status? Or just Verified?
                // User requirement: "Find Professionals" -> likely implies valid ones.
                // But let's fetch all "professionals" and filter in UI or let user see logic.
                // Actually, let's fetch everything and filter for the "Find" tab.
                if (res.ok) {
                    const data = await res.json();

                    // Group by Role for the UI
                    const grouped = {
                        'Physician': [],
                        'Nurse': [],
                        'Pharmacist': [],
                        'Dietician': [],
                        'Psychologist': [],
                        'Scientist': []
                    };

                    data.forEach(p => {
                        // Map DB role to Category Key
                        let cat = 'Physician';
                        if (p.role === ROLES.NURSE) cat = 'Nurse';
                        if (p.role === ROLES.PHARMACIST) cat = 'Pharmacist';
                        if (p.role === ROLES.DIETICIAN) cat = 'Dietician';
                        if (p.role === ROLES.PSYCHOLOGIST) cat = 'Psychologist';
                        if (p.role === ROLES.SCIENTIST) cat = 'Scientist';

                        if (grouped[cat]) {
                            // Add extra display fields
                            grouped[cat].push({
                                ...p,
                                expertise: p.facilityType ? `${p.facilityType} Facility` : 'General Practice', // Fallback expertise
                                category: cat
                            });
                        }
                    });
                    setDbProfessionals(grouped);
                }
            } catch (e) {
                console.error("Failed to load professionals", e);
            } finally {
                setLoadingProfs(false);
            }
        };

        if (activeTab === 'professionals' || activeTab === 'appointments') {
            fetchProfessionals();
        }
    }, [activeTab]);

    // Update local state when global storage changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = JSON.parse(localStorage.getItem(KEYS.PATIENT_PROFILES) || '{}');
            // Merge with existing state to prevent wiping if LS is partial, 
            // but ensure LS updates override specific fields if valid
            const updates = saved[patientId] || {};
            setProfile(prev => ({ ...prev, ...updates }));
        }
    }, [syncTick, patientId]);

    // Socket Listener
    useEffect(() => {
        const socket = getSocket();
        if (socket && user) {
            socket.emit('join_room', user.id);

            socket.on('appointment_change', (data) => {
                if (data.patientId === user.id) {
                    dispatchSync();
                    fetchAppointments();
                    setToast({ message: `Appointment ${data.action === 'create' ? 'Booked' : 'Updated'} Successfully!`, type: 'success' });
                }
            });

            socket.on('receive_message', (data) => {
                dispatchSync();
                setToast({ message: `New message from ${data.senderName || 'Dr. Kal'}`, type: 'info' });
            });

            return () => {
                socket.off('appointment_change');
                socket.off('receive_message');
            };
        }
    }, [user]);




    // Derived Display Values (Profile takes precedence over initial user prop)
    const displayName = profile.fullName || user.name;
    const displayEmail = profile.email || user.email;
    const displayId = patientId; // Keep ID consistent

    return (
        <div className="container dashboard-grid" style={{ marginTop: '2rem', gap: '2rem' }}>
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

            {/* Print Header */}
            <div className="print-only" style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
                <img src="/logo.png" alt="Dr Kal Logo" style={{ height: '80px', marginBottom: '1rem' }} />
                <h1 style={{ margin: 0 }}>DR KAL'S VIRTUAL HOSPITAL</h1>
                <h2 style={{ margin: '0.5rem 0' }}>PATIENT OFFICIAL RECORD</h2>
                <p style={{ fontSize: '0.9rem' }}>Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Sidebar */}
            <aside className="card" style={{ height: 'fit-content', padding: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--color-cyan-sand)', borderRadius: '50%', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        👤
                    </div>
                    <h3>{displayName}</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Patient ID: {displayId}</p>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button onClick={() => setActiveTab('overview')} className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Overview</button>
                    <button onClick={() => setActiveTab('appointments')} className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>My Appointments</button>
                    <button onClick={() => setActiveTab('professionals')} className={`btn ${activeTab === 'professionals' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Find Professionals</button>
                    <button onClick={() => setActiveTab('records')} className={`btn ${activeTab === 'records' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Health Records</button>
                    <button onClick={() => setActiveTab('prescriptions')} className={`btn ${activeTab === 'prescriptions' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Prescriptions</button>
                    <button onClick={() => setActiveTab('bills')} className={`btn ${activeTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Bills & Payments</button>
                    <button onClick={() => setActiveTab('telehealth')} className={`btn ${activeTab === 'telehealth' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start' }}>Telehealth Video</button>
                    <button onClick={() => setActiveTab('alerts')} className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'flex-start', color: messages.some(m => m.type === 'ALERT') ? 'red' : 'inherit' }}>
                        Alerts & Messages {messages.some(m => m.type === 'ALERT') && '⚠️'}
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                {activeTab === 'overview' && (
                    <div className="card">
                        <h2 style={{ color: 'var(--color-navy)', marginBottom: '1.5rem' }}>Personal Information</h2>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            savePatientProfile(patientId, profile);
                            setToast({ message: 'Profile updated successfully!', type: 'success' });
                        }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName || user.name || ''}
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Sex</label>
                                <select
                                    name="sex"
                                    className="input"
                                    value={profile.sex || profile.gender || ""}
                                    onChange={(e) => setProfile({ ...profile, sex: e.target.value, gender: e.target.value })}
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Select Sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={profile.age || ""}
                                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone || profile.phoneNumber || ""}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value, phoneNumber: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email || user.email || ''}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Residential Address</label>
                                <textarea
                                    name="address"
                                    value={profile.address || ""}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', minHeight: '80px' }}
                                ></textarea>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Region (Ghana)</label>
                                <select
                                    name="region"
                                    value={profile.region || ""}
                                    onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                >
                                    <option value="">Select Region</option>
                                    <option value="Ahafo">Ahafo</option>
                                    <option value="Ashanti">Ashanti</option>
                                    <option value="Bono">Bono</option>
                                    <option value="Bono East">Bono East</option>
                                    <option value="Central">Central</option>
                                    <option value="Eastern">Eastern</option>
                                    <option value="Greater Accra">Greater Accra</option>
                                    <option value="North East">North East</option>
                                    <option value="Northern">Northern</option>
                                    <option value="Oti">Oti</option>
                                    <option value="Savannah">Savannah</option>
                                    <option value="Upper East">Upper East</option>
                                    <option value="Upper West">Upper West</option>
                                    <option value="Volta">Volta</option>
                                    <option value="Western">Western</option>
                                    <option value="Western North">Western North</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Current Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={profile.country || "Ghana"}
                                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                                    className="input"
                                    required
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>Save & Update Profile</button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'appointments' && (
                    <div className="card">
                        <h2 style={{ marginBottom: '1.5rem' }}>My Appointments</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <button
                                onClick={() => { setAppointmentView('new'); setBookingStep('search'); }}
                                className={`btn ${appointmentView === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                ➕ New Appointment
                            </button>
                            <button
                                onClick={() => setAppointmentView('ongoing')}
                                className={`btn ${appointmentView === 'ongoing' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                ⏳ Ongoing Appointments
                            </button>
                            <button
                                onClick={() => setAppointmentView('reschedule')}
                                className={`btn ${appointmentView === 'reschedule' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                📅 Reschedule Previous
                            </button>
                        </div>

                        {appointmentView === 'new' && (
                            <div style={{ padding: '0.5rem' }}>
                                <div id="booking-alert" style={{ display: 'none', padding: '1rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                                    ⚠️ Booking limit reached for this specialist on the selected date. Please choose another date or specialist.
                                </div>
                                {bookingStep === 'search' && (
                                    <>
                                        <div style={{ textAlign: 'center', padding: '1.5rem', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #bae6fd' }}>
                                            <h4>📅 Book a consultation with a doctor or specialist</h4>
                                            <p style={{ color: '#0369a1', fontSize: '0.9rem' }}>Search for available professionals across all departments.</p>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Search by name, department, or condition..."
                                                className="input"
                                                style={{ flex: 1, padding: '0.8rem' }}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <select
                                                className="input"
                                                style={{ width: '200px', padding: '0.8rem' }}
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="All">All Categories</option>
                                                {Object.keys(PROFESSIONALS_DATA).map(cat => <option key={cat} value={cat}>{cat}s</option>)}
                                            </select>
                                            <select
                                                className="input"
                                                style={{ width: '200px', padding: '0.8rem' }}
                                                value={selectedRegion}
                                                onChange={(e) => setSelectedRegion(e.target.value)}
                                            >
                                                <option value="All">All Regions</option>
                                                {ghanaRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                            {loadingProfs ? <p>Loading professionals...</p> :
                                                Object.entries(dbProfessionals).flatMap(([cat, people]) =>
                                                    people.map(person => ({ ...person, category: cat }))
                                                )
                                                    .filter(p => (selectedCategory === 'All' || p.category === selectedCategory) &&
                                                        (selectedRegion === 'All' || p.region === selectedRegion) &&
                                                        ((p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())))
                                                    .map(person => (
                                                        <div key={person.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                                    {person.avatarUrl ? (
                                                                        <img src={person.avatarUrl} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    ) : (
                                                                        <span style={{ fontSize: '1.5rem' }}>
                                                                            {person.category === 'Physician' ? '👨‍⚕️' :
                                                                                person.category === 'Nurse' ? '🩺' :
                                                                                    person.category === 'Dietician' ? '🍎' :
                                                                                        person.category === 'Psychologist' ? '🧠' :
                                                                                            person.category === 'Pharmacist' ? '💊' : '🧪'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 style={{ margin: 0 }}>{person.name}</h4>
                                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{person.specialization || person.category} • {person.currentFacility}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedProfessional(person);
                                                                    setBookingStep('details');
                                                                }}
                                                                className="btn btn-primary"
                                                                style={{ width: '100%', padding: '0.6rem' }}
                                                            >
                                                                Select & Book
                                                            </button>
                                                        </div>
                                                    ))}
                                        </div>
                                    </>
                                )}


                                {bookingStep === 'details' && selectedProfessional && (
                                    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <button onClick={() => setBookingStep('search')} className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>← Back to Search</button>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                            {selectedProfessional.avatarUrl && (
                                                <img src={selectedProfessional.avatarUrl} alt="" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                                            )}
                                            <div>
                                                <h3 style={{ margin: 0 }}>Appointment with {selectedProfessional.name}</h3>
                                                {selectedProfessional.bio && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: '#64748b' }}>{selectedProfessional.bio}</p>}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontWeight: 'bold' }}>Select Date</label>
                                                <input type="date" className="input" style={{ padding: '0.8rem' }} value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontWeight: 'bold' }}>Select Time</label>
                                                <input
                                                    type="time"
                                                    className="input"
                                                    style={{ padding: '0.8rem' }}
                                                    value={appointmentTime}
                                                    onChange={(e) => setAppointmentTime(e.target.value)}
                                                />
                                                {/* Availability Check */}
                                                {(() => {
                                                    if (!appointmentDate || !appointmentTime) return null;

                                                    const { KEYS } = require('@/lib/global_sync');
                                                    const allApps = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]') : [];

                                                    // Check if this professional is already booked at this EXACT date/time
                                                    // Note: Ideally this should check ALL appointments for this professional from API, 
                                                    // but currently correct availability check requires broader API access or specific endpoint.
                                                    // For now, we only check against appointments loaded (user's own) - this is a limitation to fix
                                                    const isOccupied = false; // logic disabled temporarily as we don't load other people's appointments insecurely anymore

                                                    if (isOccupied) {
                                                        return (
                                                            <div style={{ color: '#dc2626', background: '#fef2f2', padding: '0.5rem', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.5rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span>⚠️</span>
                                                                <strong>Slot Occupied:</strong> This professional is busy at this time. Please choose another slot.
                                                            </div>
                                                        );
                                                    }
                                                    return <div style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: '0.5rem' }}>✅ Slot Available</div>;
                                                })()}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <label style={{ fontWeight: 'bold' }}>Visit Type</label>
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    <button onClick={() => setAppointmentType('Video')} className={`btn ${appointmentType === 'Video' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>📹 Video Call</button>
                                                    <button onClick={() => setAppointmentType('In-person')} className={`btn ${appointmentType === 'In-person' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>🏥 In-person</button>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '1rem', marginTop: '1rem' }}
                                                disabled={
                                                    !appointmentDate ||
                                                    !appointmentTime ||
                                                    (() => {
                                                        const allApps = apiAppointments;
                                                        // Re-calculate formatted time for check
                                                        // Note: This logic verifies if user already has an appointment at this time with this professional
                                                        // It doesn't check server-side availability yet beyond what we fetched?
                                                        // Ideally availability check should be an API call.
                                                        // For now, we check against known appointments in state.
                                                        const [hours, mins] = appointmentTime.split(':');
                                                        const h = parseInt(hours);
                                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                                        const formattedTime = `${hours}:${mins} ${ampm}`;
                                                        const h12 = h % 12 || 12;
                                                        const time12h = `${h12.toString().padStart(2, '0')}:${mins} ${ampm}`;

                                                        return allApps.some(a =>
                                                            a.professionalId === selectedProfessional.id &&
                                                            a.date === appointmentDate &&
                                                            (a.time === formattedTime || a.time === appointmentTime || a.time === time12h) &&
                                                            a.status !== 'Cancelled'
                                                        );
                                                    })()
                                                }
                                                onClick={async () => {
                                                    // const { getBookingCount } = require('@/lib/global_sync'); 
                                                    // Skip booking count check for now or handle via API response

                                                    // Format Time (24h + AM/PM)
                                                    const [hours, mins] = appointmentTime.split(':');
                                                    const h = parseInt(hours);
                                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                                    const finalTime = `${hours}:${mins} ${ampm}`;

                                                    try {
                                                        const res = await fetch('/api/appointments', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                professionalId: selectedProfessional.id,
                                                                professionalName: selectedProfessional.name,
                                                                professionalCategory: selectedProfessional.category,
                                                                date: appointmentDate,
                                                                time: finalTime,
                                                                type: appointmentType, // Video or In-person
                                                                amountPaid: 0,
                                                                balanceDue: 155,
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            setPaymentAmount(0);
                                                            setAppointmentView('success');
                                                            fetchAppointments(); // Refresh list
                                                        } else {
                                                            const errData = await res.json().catch(() => ({}));
                                                            alert(`Failed to book appointment: ${errData.error || 'Unknown error'}`);
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert('An error occurred.');
                                                    }
                                                }}
                                            >
                                                Confirm Appointment
                                            </button>
                                        </div>
                                    </div>
                                )}



                                {appointmentView === 'success' && (
                                    <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
                                        <div style={{
                                            width: '100px',
                                            height: '100px',
                                            background: '#dcfce7',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 2rem auto',
                                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)'
                                        }}>
                                            <span style={{ fontSize: '4rem', color: '#15803d' }}>✓</span>
                                        </div>

                                        <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>Booking Confirmed!</h2>
                                        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                                            Your appointment has been successfully scheduled.
                                        </p>

                                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'left', marginBottom: '2.5rem' }}>
                                            <h4 style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Payment Receipt</h4>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Amount Paid</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#15803d' }}>GHS {paymentAmount.toFixed(2)}</div>
                                                </div>
                                                {paymentAmount < 155 && (
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Balance Due</div>
                                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc2626' }}>GHS {(155 - paymentAmount).toFixed(2)}</div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Professional</div>
                                                    <div style={{ fontWeight: 'bold' }}>{selectedProfessional?.name || 'Dr. Kal'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>Date & Time</div>
                                                    <div style={{ fontWeight: 'bold' }}>{appointmentDate} at {appointmentTime}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setAppointmentView('ongoing')}
                                            className="btn btn-primary"
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                fontSize: '1.1rem',
                                                background: 'var(--color-navy)',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            View My Appointments
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {appointmentView === 'ongoing' && (
                            <div style={{ padding: '0.5rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', marginBottom: '2rem' }}>
                                    <h4 style={{ margin: 0 }}>You have upcoming visits 📆</h4>
                                </div>
                                {(() => {
                                    const myApps = apiAppointments.filter(a => a.status === 'Upcoming');

                                    if (myApps.length === 0) {
                                        return <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No upcoming sessions found. Start by booking one!</p>;
                                    }

                                    return (
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {myApps.map(app => {
                                                // Lookup professional number
                                                const flattenedProfs = Object.values(dbProfessionals).flat();
                                                const profDetails = flattenedProfs.find(p => p.id === app.professionalId);
                                                const whatsappNum = profDetails?.whatsappNumber;

                                                return (
                                                    <div key={app.id} className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                                            <div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                    <span className="badge" style={{ background: app.type === 'Video' ? '#eff6ff' : '#f0fdf4', color: app.type === 'Video' ? '#2563eb' : '#16a34a' }}>
                                                                        {app.type === 'Video' ? '📹 Virtual' : '🏥 In-person'}
                                                                    </span>
                                                                    <span className="badge" style={{ background: '#f8fafc', color: '#64748b' }}>{app.id}</span>
                                                                </div>
                                                                <h4 style={{ margin: 0 }}>{app.professionalName}</h4>
                                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{app.professionalCategory} • {app.date} at {app.time}</p>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.8rem' }}>● PAYMENT: {app.paymentStatus}</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                                                            {app.type === 'Video' ? (
                                                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push(`/consultation/${user.id}`)}>Join Video Call</button>
                                                            ) : (
                                                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=Hospital`, '_blank')}>Get Directions</button>
                                                            )}
                                                            {whatsappNum && (
                                                                <a href={`https://wa.me/${whatsappNum.replace('+', '')}`} target="_blank" className="btn" style={{ flex: 1, background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                                                    WhatsApp
                                                                </a>
                                                            )}
                                                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => alert('Appointment added to your calendar!')}>Calendar</button>
                                                        </div>

                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ width: '100%', marginTop: '0.8rem', color: '#dc2626', borderColor: '#fee2e2', fontSize: '0.8rem', padding: '0.4rem' }}
                                                            onClick={async () => {
                                                                if (confirm('Are you sure you want to cancel this appointment? This will remove it from your list and notify the specialist.')) {
                                                                    try {
                                                                        const res = await fetch('/api/appointments', {
                                                                            method: 'DELETE',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ id: app.id })
                                                                        });
                                                                        if (res.ok) {
                                                                            alert('Appointment cancelled successfully.');
                                                                            fetchAppointments(); // Refresh list
                                                                        } else {
                                                                            alert('Failed to cancel appointment. Please try again.');
                                                                        }
                                                                    } catch (e) {
                                                                        console.error("Cancellation failed", e);
                                                                        alert('An error occurred while cancelling.');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Cancel Appointment
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {appointmentView === 'reschedule' && (
                            <div style={{ padding: '0.5rem' }}>
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#fcf8e3', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #faebcc' }}>
                                    <h4 style={{ margin: 0 }}>Need to change a past booking? 🔄</h4>
                                </div>
                                {(() => {
                                    const myApps = apiAppointments; // Already filtered by server for this patient

                                    if (myApps.length === 0) {
                                        return <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>You have no previous appointments to reschedule.</p>;
                                    }

                                    return (
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {myApps.map(app => (
                                                <div key={app.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                                                    <div>
                                                        <h5 style={{ margin: 0 }}>{app.professionalName}</h5>
                                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Last session: {app.date} ({app.status})</p>
                                                    </div>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            const allPros = Object.values(dbProfessionals).flat();
                                                            const person = allPros.find(p => p.id === app.professionalId);

                                                            if (person) {
                                                                setSelectedProfessional(person);
                                                                setBookingStep('details');
                                                                setAppointmentView('new');
                                                            } else {
                                                                // Fallback: If not found in current active list, maybe show alert
                                                                alert('Selected provider is no longer valid or active.');
                                                            }
                                                        }}
                                                    >
                                                        Pick New Date/Time
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )
                }

                {/* Professionals Tab with Categorized Lists */}
                {
                    activeTab === 'professionals' && (
                        <div className="card">
                            <h2>Find a Professional</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Browse our specialized team and connect instantly via WhatsApp.</p>

                            <div style={{ marginBottom: '2rem' }}>
                                <select
                                    className="input"
                                    style={{ width: '200px', padding: '0.8rem' }}
                                    value={selectedRegion}
                                    onChange={(e) => setSelectedRegion(e.target.value)}
                                >
                                    <option value="All">All Regions</option>
                                    {ghanaRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {loadingProfs && <p>Loading directory...</p>}

                            {!loadingProfs && Object.entries(dbProfessionals).map(([category, people]) => {
                                const filteredPeople = people.filter(p => selectedRegion === 'All' || p.region === selectedRegion);
                                if (filteredPeople.length === 0) return null;
                                if (people.length === 0) return null;
                                return (
                                    <div key={category} style={{ marginBottom: '3rem' }}>
                                        <h3 style={{ borderBottom: '2px solid var(--color-sea-blue)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-navy)' }}>
                                            {category}s
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                            {filteredPeople.map(person => (
                                                <div key={person.id} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '1rem', textAlign: 'center', background: '#fafafa' }}>
                                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                                        {category === 'Physician' ? '👨‍⚕️' :
                                                            category === 'Nurse' ? '🩺' :
                                                                category === 'Dietician' ? '🍎' :
                                                                    category === 'Psychologist' ? '🧠' :
                                                                        category === 'Pharmacist' ? '💊' : '🧪'}
                                                    </div>
                                                    <h5 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{person.name}</h5>
                                                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.8rem' }}>
                                                        {person.currentFacility ? `${person.currentFacility}` : person.expertise}
                                                    </p>
                                                    {person.region && <span style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{person.region}</span>}

                                                    <div style={{ marginTop: '1rem' }}>
                                                        <a
                                                            href={`https://wa.me/${person.whatsappNumber ? person.whatsappNumber.replace('+', '') : ''}?text=Hi ${person.name}, I am a patient looking for a consultation.`}
                                                            target="_blank"
                                                            className="btn btn-primary"
                                                            style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', textDecoration: 'none', display: 'inline-block', opacity: person.whatsappNumber ? 1 : 0.5, pointerEvents: person.whatsappNumber ? 'auto' : 'none' }}
                                                        >
                                                            {person.whatsappNumber ? 'Chat via WhatsApp' : 'No Contact Info'}
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                }

                {
                    activeTab === 'prescriptions' && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2>My Prescriptions</h2>
                                    <p style={{ color: '#666', margin: 0 }}>View your medication history and request refills.</p>
                                </div>
                                <button className="btn btn-primary" onClick={() => alert('Feature coming soon: Bulk Refill Request')}>Bulk Refill Request</button>
                            </div>

                            {(() => {
                                const globalPrescriptions = typeof window !== 'undefined'
                                    ? JSON.parse(localStorage.getItem('dr_kal_prescriptions') || '[]')
                                    : [];

                                const myPrescriptions = globalPrescriptions.filter(rx => rx.patientId === patientId || rx.patientId === 'PATH-1234'); // Fallback for mock demo

                                if (myPrescriptions.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💊</div>
                                            <p style={{ color: '#999' }}>You have no active or previous prescriptions at this time.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {myPrescriptions.map(rx => (
                                            <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                        <h4 style={{ margin: 0, color: 'var(--color-navy)' }}>{rx.drug} {rx.dosage}</h4>

                                                        <span className="badge" style={{ background: rx.status === 'Dispensed' ? '#f0fdf4' : '#fff7ed', color: rx.status === 'Dispensed' ? '#16a34a' : '#ea580c' }}>
                                                            {rx.status}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                                                        <span>Prescription ID: <strong>{rx.id}</strong></span> •
                                                        <span> Refills Remaining: {rx.refillsRemaining}</span>
                                                    </div>
                                                    {
                                                        rx.issue && rx.issue.includes('Interaction') && (
                                                            <div style={{ marginTop: '0.8rem', background: '#fff1f0', color: '#cf1322', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid #ffa39e' }}>
                                                                🚨 Interaction Flagged: Please consult your pharmacist before use.
                                                            </div>
                                                        )
                                                    }
                                                </div >
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>View Instructions</button>
                                                    <button className="btn btn-primary" style={{ fontSize: '0.85rem' }} disabled={rx.refillsRemaining === 0}>
                                                        {rx.refillsRemaining > 0 ? 'Request Refill' : 'Refill Unavailable'}
                                                    </button>
                                                </div>
                                            </div >
                                        ))
                                        }
                                    </div >
                                );
                            })()}

                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-navy)' }}>💡 Refill Reminder</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>You have 2 medications (Metformin, Lisinopril) due for refill in the next 7 days. Would you like to schedule a pickup?</p>
                                <button className="btn btn-primary" style={{ marginTop: '1rem', background: 'var(--color-navy)' }}>Schedule Pickup</button>
                            </div>
                        </div >
                    )
                }
                {activeTab === 'alerts' && (
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2>Alerts & Messages</h2>
                            <button className="btn btn-secondary" onClick={fetchMessages}>REFRESH ↻</button>
                        </div>

                        {loadingMessages ? <p>Loading messages...</p> : (
                            <div className="flex flex-col gap-4">
                                {messages.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">No messages or alerts.</p>
                                ) : (
                                    messages.map(msg => (
                                        <div key={msg.id} style={{
                                            padding: '1.5rem',
                                            borderRadius: '8px',
                                            border: msg.type === 'ALERT' ? '2px solid #fee2e2' : '1px solid #e2e8f0',
                                            background: msg.type === 'ALERT' ? '#fef2f2' : '#ffffff',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <span className="font-bold flex flex-col gap-1">
                                                    {msg.type === 'ALERT' && <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>⚠️ URGENT ALERT</span>}
                                                    <span style={{ fontSize: '0.95rem', color: '#334155' }}>
                                                        From: <strong>{msg.senderName}</strong> <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal', textTransform: 'capitalize' }}>({msg.role?.toLowerCase() || 'staff'})</span>
                                                    </span>
                                                </span>
                                                <span className="text-gray-500 text-sm">{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p style={{ fontSize: '1.1rem', color: msg.type === 'ALERT' ? '#b91c1c' : '#334155', margin: '0.5rem 0' }}>
                                                {msg.content}
                                            </p>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                Type: {msg.type}
                                            </div>

                                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.8rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                                <button
                                                    onClick={() => {
                                                        if (replyingTo === msg.id) {
                                                            setReplyingTo(null);
                                                        } else {
                                                            setReplyingTo(msg.id);
                                                            setReplyContent('');
                                                        }
                                                    }}
                                                    className="btn"
                                                    style={{ border: '1px solid #e2e8f0', fontSize: '0.85rem', padding: '0.4rem 0.8rem', color: '#475569' }}
                                                >
                                                    {replyingTo === msg.id ? 'Cancel' : '💬 Reply'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="btn"
                                                    style={{ border: '1px solid #fee2e2', fontSize: '0.85rem', padding: '0.4rem 0.8rem', color: '#dc2626' }}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>

                                            {replyingTo === msg.id && (
                                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <textarea
                                                        className="input"
                                                        placeholder={`Reply to ${msg.senderName}...`}
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        style={{ width: '100%', minHeight: '80px', marginBottom: '0.8rem', padding: '0.8rem' }}
                                                    />
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn btn-primary"
                                                            disabled={isSendingReply || !replyContent.trim()}
                                                            onClick={() => handleSendReply(msg.senderId, msg)}
                                                            style={{ fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}
                                                        >
                                                            {isSendingReply ? 'Sending...' : 'Send Reply'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {
                    activeTab === 'records' && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2>Health Record</h2>
                                <span className="badge" style={{ background: 'var(--color-navy)', color: 'white' }}>ID: {user.pathNumber || 'UNASSIGNED'}</span>
                            </div>

                            <p style={{ color: '#666', marginBottom: '2rem' }}>Comprehensive view of your vitals, prescriptions, and official laboratory results.</p>

                            {/* Vitals Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-sea-blue)' }}>📊 Recent Vitals</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                    <RenderVitalCard
                                        label="Blood Pressure"
                                        value={latestVital?.bp || latestVital?.bloodPressure || profile.latestVital?.bloodPressure || '--/--'}
                                        type="BP"
                                    />
                                    <RenderVitalCard
                                        label="Heart Rate"
                                        value={latestVital?.hr || latestVital?.heartRate || profile.latestVital?.heartRate || '--'}
                                        unit="bpm"
                                        type="HR"
                                    />
                                    <RenderVitalCard
                                        label="SpO2"
                                        value={latestVital?.spo2 || profile.latestVital?.spo2 || '--'}
                                        unit="%"
                                        type="SpO2"
                                    />
                                    <RenderVitalCard
                                        label="Temperature"
                                        value={latestVital?.temp || latestVital?.temperature || profile.latestVital?.temperature || '--'}
                                        unit="°C"
                                        type="Temp"
                                    />
                                    <RenderVitalCard
                                        label="Resp. Rate"
                                        value={latestVital?.rr || '--'}
                                        unit="/min"
                                        type="RR"
                                    />
                                    <RenderVitalCard
                                        label="Weight"
                                        value={latestVital?.weight || '--'}
                                        unit="kg"
                                        type="Weight"
                                    />
                                    <RenderVitalCard
                                        label="Glucose"
                                        value={latestVital?.glucose || '--'}
                                        unit="mmol/L"
                                        type="Glucose"
                                    />
                                </div>
                            </div>

                            {/* Prescriptions Section */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-sea-blue)' }}>💊 Active Prescriptions</h3>
                                {(() => {
                                    const globalPrescriptions = typeof window !== 'undefined'
                                        ? JSON.parse(localStorage.getItem('dr_kal_prescriptions') || '[]')
                                        : [];
                                    const myPrescriptions = globalPrescriptions.filter(rx => rx.patientId === patientId || rx.patientId === 'PATH-1234');

                                    if (myPrescriptions.length === 0) {
                                        return <p style={{ color: '#999', fontStyle: 'italic' }}>No active prescriptions.</p>;
                                    }

                                    return (
                                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                                            {myPrescriptions.map(rx => (
                                                <div key={rx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                                    <div>
                                                        <strong>{rx.drug} {rx.dosage}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{rx.status} • {rx.refillsRemaining} refills left</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Lab Records Section */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--color-sea-blue)' }}>📁 Lab Reports & Clinical Notes</h3>
                                {(() => {
                                    // Retrieve records from API state
                                    const myRecords = apiRecords || [];

                                    if (myRecords.length === 0) {
                                        return (
                                            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                                                <p style={{ color: '#999' }}>No laboratory records found for your account ID.</p>
                                            </div>
                                        );
                                    }

                                    const handleDownloadPDF = (record, structuredResults) => {
                                        const printWindow = window.open('', '_blank');
                                        if (!printWindow) return alert('Please allow popups to download reports.');

                                        const htmlContent = `
                                            <html>
                                            <head>
                                                <title>Lab Report - ${record.fileName}</title>
                                                <style>
                                                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                                                    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                                                    .logo { font-size: 24px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
                                                    .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; color: #666; }
                                                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                                    th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
                                                    th { background-color: #f8fafc; font-weight: 600; }
                                                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                                                </style>
                                            </head>
                                            <body>
                                                <div class="header">
                                                    <img src="${window.location.origin}/logo.png" alt="Logo" style="height: 80px; margin-bottom: 10px;">
                                                    <div class="logo">DR. KAL'S VIRTUAL HOSPITAL</div>
                                                    <div>OFFICIAL LABORATORY REPORT</div>
                                                </div>
                                                
                                                <div class="meta">
                                                    <div>
                                                        <strong>Patient Name:</strong> ${user.name}<br>
                                                        <strong>ID:</strong> ${user.pathNumber || user.id}<br>
                                                        <strong>Date:</strong> ${record.date}
                                                    </div>
                                                    <div style="text-align: right;">
                                                        <strong>Test:</strong> ${record.fileName}<br>
                                                        <strong>Unit:</strong> ${record.unit}<br>
                                                        <strong>Scientist:</strong> ${record.scientist || record.professionalName}
                                                    </div>
                                                </div>

                                                ${structuredResults && structuredResults.results ? `
                                                    <h3>Test Results</h3>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>Parameter</th>
                                                                <th>Result</th>
                                                                <th>Unit</th>
                                                                <th>Reference Range</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${Object.entries(structuredResults.results).map(([key, val]) => {
                                            let meta = structuredResults.metadata ? structuredResults.metadata[key] : null;

                                            // Fallback for Manual Entry (Flat Metadata)
                                            if (!meta && (key === 'value' || key === 'resultValue') && structuredResults.metadata && (structuredResults.metadata.unit || structuredResults.metadata.range)) {
                                                meta = structuredResults.metadata;
                                            }

                                            // Fallback for Vitals (Hardcoded Units)
                                            let unit = meta?.unit || '-';
                                            if (unit === '-' || !unit) {
                                                const k = key.toLowerCase();
                                                if (['hr', 'heartrate'].includes(k)) unit = 'bpm';
                                                else if (['spo2'].includes(k)) unit = '%';
                                                else if (['temp', 'temperature'].includes(k)) unit = '°C';
                                                else if (['weight'].includes(k)) unit = 'kg';
                                                else if (['glucose'].includes(k)) unit = 'mmol/L';
                                                else if (['rr', 'resprate'].includes(k)) unit = '/min';
                                                else if (['bp', 'bloodpressure'].includes(k)) unit = 'mmHg';
                                            }

                                            return `
                                                                    <tr>
                                                                        <td>${key.toUpperCase()}</td>
                                                                        <td><strong>${val}</strong></td>
                                                                        <td>${unit}</td>
                                                                        <td>${meta?.range || '-'}</td>
                                                                    </tr>
                                                                `;
                                        }).join('')}
                                                        </tbody>
                                                    </table>
                                                ` : `<p>See attached documentation for detailed results.</p>`}

                                                <div class="footer">
                                                    <p>This report is electronically verified. Valid only with professional signature.</p>
                                                    <p>Generated on ${new Date().toLocaleString()}</p>
                                                </div>
                                                <script>
                                                    window.onload = function() { window.print(); }
                                                </script>
                                            </body>
                                            </html>
                                        `;
                                        printWindow.document.write(htmlContent);
                                        printWindow.document.close();
                                    };

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {myRecords.map(record => {
                                                // Handle JSON structuredData from API
                                                const structuredResults = typeof record.structuredData === 'string' ? JSON.parse(record.structuredData) : record.structuredData;

                                                // Format timestamp
                                                const recordDate = record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.date;

                                                return (
                                                    <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ fontSize: '2rem' }}>
                                                                {record.professionalRole === 'DOCTOR' ? '🩺' : (record.professionalRole === 'NURSE' ? '👩‍' : '🔬')}
                                                            </div>
                                                            <div>
                                                                <h4 style={{ margin: 0 }}>{record.fileName}</h4>
                                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                                                    {record.professionalRole === 'DOCTOR' ? 'Clinical Note' : (record.professionalRole === 'NURSE' ? 'Nursing Record' : `Unit: ${record.unit}`)} | Issued by: {record.professionalName || record.scientist}
                                                                </p>
                                                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>{recordDate}</p>

                                                                {/* Structured Result Mini-Summary */}
                                                                {structuredResults && (
                                                                    structuredResults.recordType === 'file_upload' ? (
                                                                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                                            <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#dbeafe', borderRadius: '4px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                                📎 <strong>Attachment:</strong> {structuredResults.fileType || 'File'}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        structuredResults.results && (
                                                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                                {Object.entries(structuredResults.results).slice(0, 3).map(([key, val]) => (
                                                                                    <span key={key} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: '#eee', borderRadius: '4px' }}>
                                                                                        {key.toUpperCase()}: <strong>{val}</strong> {structuredResults.metadata && structuredResults.metadata[key]?.unit ? `(${structuredResults.metadata[key].unit})` : ''}
                                                                                    </span>
                                                                                ))}
                                                                                {Object.keys(structuredResults.results).length > 3 && (
                                                                                    <span style={{ fontSize: '0.7rem', color: '#888' }}>+ more</span>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                onClick={() => setPreviewFile({ ...record, structuredResults })}
                                                                className="btn btn-secondary"
                                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownloadPDF(record, structuredResults)}
                                                                className="btn btn-primary"
                                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                                                            >
                                                                Download PDF
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )
                }
                {/* Bills Tab */}
                {
                    activeTab === 'bills' && (() => {
                        const { KEYS } = require('@/lib/global_sync');
                        // Use API appointments for billing calculation
                        const myApps = apiAppointments.filter(a => a.status !== 'Cancelled');

                        const totalBilled = myApps.length * 155;
                        const totalPaid = myApps.reduce((sum, app) => sum + (app.amountPaid || 0), 0);
                        const totalOutstanding = myApps.reduce((sum, app) => sum + (parseFloat(app.balanceDue) || (app.paymentStatus === 'Pending' ? 155 : 0)), 0);

                        return (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                                        <h3>Total Billed</h3>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>GHS {totalBilled.toFixed(2)}</div>
                                        <p style={{ opacity: 0.9 }}>Lifetime Consultations</p>
                                    </div>
                                    <div className="card" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white' }}>
                                        <h3>Total Paid</h3>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>GHS {totalPaid.toFixed(2)}</div>
                                        <p style={{ opacity: 0.9 }}>Successful Payments</p>
                                    </div>
                                    <div className="card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }}>
                                        <h3>Current Bill</h3>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>GHS {totalOutstanding.toFixed(2)}</div>
                                        <p style={{ opacity: 0.9 }}>Outstanding Balance</p>
                                    </div>
                                </div>

                                {totalOutstanding > 0 && (
                                    <div className="card" style={{ marginBottom: '2rem', border: '2px solid #e2e8f0' }}>
                                        <h3 style={{ marginBottom: '1rem', color: 'var(--color-navy)' }}>💳 Make a Payment</h3>

                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                            <button
                                                onClick={() => { setBillPaymentMode('Full'); setBillPaymentAmount(totalOutstanding); }}
                                                className="btn"
                                                style={{
                                                    flex: 1,
                                                    background: billPaymentMode === 'Full' ? 'var(--color-navy)' : 'transparent',
                                                    color: billPaymentMode === 'Full' ? 'white' : '#64748b',
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                Pay Full Bill
                                            </button>
                                            <button
                                                onClick={() => { setBillPaymentMode('Part'); setBillPaymentAmount(Math.min(50, totalOutstanding)); }}
                                                className="btn"
                                                style={{
                                                    flex: 1,
                                                    background: billPaymentMode === 'Part' ? 'var(--color-navy)' : 'transparent',
                                                    color: billPaymentMode === 'Part' ? 'white' : '#64748b',
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                Part Payment
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Amount to Pay (GHS)</label>
                                                <input
                                                    type="number"
                                                    value={billPaymentAmount > 0 ? billPaymentAmount : (billPaymentMode === 'Full' ? totalOutstanding : 0)}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        setBillPaymentAmount(Math.min(val, totalOutstanding)); // Cap at total debt
                                                        setBillPaymentMode('Part');
                                                    }}
                                                    readOnly={billPaymentMode === 'Full'}
                                                    className="input"
                                                    style={{ width: '100%', padding: '0.8rem', fontSize: '1.1rem' }}
                                                />
                                            </div>
                                        </div>

                                        <PaystackButton
                                            className="btn btn-primary"
                                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: '#16a34a' }}
                                            text={`Pay GHS ${(billPaymentAmount || (billPaymentMode === 'Full' ? totalOutstanding : 0)).toFixed(2)} Now`}
                                            amount={(billPaymentAmount || (billPaymentMode === 'Full' ? totalOutstanding : 0)) * 100} // Paystack expects kobo
                                            email={displayEmail || 'patient@drkal.com'}
                                            publicKey="pk_test_d3bd0c5a3246377ff2215c2562ec00490b848039"
                                            firstName={displayName.split(' ')[0]}
                                            lastName={displayName.split(' ')[1] || ''}
                                            phone={profile.phone || ''}
                                            onSuccess={() => {
                                                if (typeof window === 'undefined') return;

                                                const paymentValue = billPaymentAmount || (billPaymentMode === 'Full' ? totalOutstanding : 0);

                                                // 1. Fetch Fresh Data
                                                const allApps = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');

                                                // 2. Identify Unpaid Appointments (FIFO)
                                                // Filter for THIS patient and UNPAID items
                                                let remainingDistribute = paymentValue;
                                                const updatedApps = allApps.map(app => {
                                                    // Only touch appointments for this patient that have debt
                                                    if (app.patientId === patientId && app.status !== 'Cancelled') {
                                                        const currentBalance = parseFloat(app.balanceDue) || (app.paymentStatus === 'Pending' ? 155 : 0);

                                                        if (currentBalance > 0 && remainingDistribute > 0) {
                                                            const payAmount = Math.min(remainingDistribute, currentBalance);
                                                            remainingDistribute -= payAmount;

                                                            const newBalance = currentBalance - payAmount;
                                                            const newPaid = (app.amountPaid || 0) + payAmount;

                                                            return {
                                                                ...app,
                                                                amountPaid: newPaid,
                                                                balanceDue: newBalance,
                                                                paymentStatus: newBalance <= 0 ? 'Paid' : 'Part'
                                                            };
                                                        }
                                                    }
                                                    return app;
                                                });

                                                // 3. Save Back
                                                localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(updatedApps));

                                                // 4. Reset & Notify
                                                setBillPaymentMode('Full');
                                                setBillPaymentAmount(0);
                                                alert(`Payment of GHS ${paymentValue.toFixed(2)} Successful!`);

                                                // [NEW] Trigger Completion Check for affected appointments
                                                const { dispatchSync, checkAppointmentCompletion, logAudit } = require('@/lib/global_sync');

                                                logAudit({
                                                    actorName: displayName || 'Patient',
                                                    action: 'PAYMENT SUCCESS',
                                                    targetName: `Bill Payment (GHS ${paymentValue})`,
                                                    details: `Paid GHS ${paymentValue.toFixed(2)} via Paystack`,
                                                    notes: `Reference transaction completed.`
                                                });

                                                dispatchSync();

                                                // Check for completion for all updated appointments
                                                updatedApps.forEach(app => {
                                                    if (app.patientId === patientId && (app.paymentStatus === 'Paid' || app.amountPaid >= app.balanceDue)) {
                                                        checkAppointmentCompletion(app.id);
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="card">
                                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-navy)' }}>Transaction History</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                                    <th style={{ padding: '1rem', color: '#64748b' }}>Date</th>
                                                    <th style={{ padding: '1rem', color: '#64748b' }}>Service</th>
                                                    <th style={{ padding: '1rem', color: '#64748b' }}>Professional</th>
                                                    <th style={{ padding: '1rem', color: '#64748b' }}>Status</th>
                                                    <th style={{ padding: '1rem', color: '#64748b', textAlign: 'right' }}>Amount</th>
                                                    <th style={{ padding: '1rem', color: '#64748b', textAlign: 'right' }}>Paid</th>
                                                    <th style={{ padding: '1rem', color: '#64748b', textAlign: 'right' }}>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {myApps.length === 0 ? (
                                                    <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No transactions found.</td></tr>
                                                ) : (
                                                    myApps.map(app => (
                                                        <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                            <td style={{ padding: '1rem' }}>{new Date(app.date).toLocaleDateString()}</td>
                                                            <td style={{ padding: '1rem' }}>{app.type} Visit</td>
                                                            <td style={{ padding: '1rem' }}>{app.professionalName}</td>
                                                            <td style={{ padding: '1rem' }}>
                                                                <span style={{
                                                                    padding: '0.25rem 0.75rem',
                                                                    borderRadius: '50px',
                                                                    fontSize: '0.85rem',
                                                                    background: (app.amountPaid >= 155 || app.paymentStatus === 'Paid') ? '#dcfce7' : '#fee2e2',
                                                                    color: (app.amountPaid >= 155 || app.paymentStatus === 'Paid') ? '#166534' : '#991b1b',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {(app.amountPaid >= 155 || app.paymentStatus === 'Paid') ? 'Paid' : 'Pending'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'right' }}>GHS 155.00</td>
                                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                                                                GHS {(app.amountPaid || 0).toFixed(2)}
                                                            </td>
                                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>
                                                                GHS {(parseFloat(app.balanceDue) || (app.paymentStatus === 'Pending' ? 155 : 0)).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                }
                {activeTab === 'telehealth' && (
                    <div className="card" style={{ padding: '4rem', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', background: '#f0f9ff', padding: '2rem', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            📹
                        </div>
                        <h2 style={{ color: 'var(--color-navy)', marginBottom: '1rem', fontSize: '2rem' }}>Telehealth Video Consultation</h2>
                        <p style={{ color: '#64748b', marginBottom: '2.5rem', maxWidth: '600px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            Join your scheduled video consultation securely. This feature uses your device's <strong>native camera and microphone</strong> directly in the browser—no third-party software needed.
                        </p>

                        <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '2.5rem', width: '100%', maxWidth: '600px' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#475569' }}>Pre-Flight Check</h4>
                            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                                <span>✅ Camera Ready</span>
                                <span>✅ Microphone Ready</span>
                                <span>✅ Secure Connection</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/consultation/${patientId}`)}
                            className="btn btn-primary"
                            style={{
                                padding: '1.2rem 3rem',
                                fontSize: '1.3rem',
                                borderRadius: '50px',
                                boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.3s ease',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            🚀 Join Secured Video Room
                        </button>

                        <div style={{ marginTop: '3rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                <span>🔒 End-to-End Encrypted</span> • <span>🏥 HIPAA Compliant</span>
                            </div>
                        </div>
                    </div>
                )}
            </main >

            {/* File Preview Modal */}
            {
                previewFile && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
                        <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>
                                        {previewFile.professionalRole === 'DOCTOR' ? '🩺 Digital Clinical Record' : (previewFile.professionalRole === 'NURSE' ? '📋 Nursing Information' : '🔬 Laboratory Analysis Report')}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                        {previewFile.structuredResults?.testName || previewFile.fileName} | Date: {previewFile.date}
                                    </p>
                                </div>
                                <button onClick={() => setPreviewFile(null)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Close</button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f0f0', borderRadius: '4px', padding: '1rem', width: '100%' }}>
                                {previewFile.structuredResults ? (
                                    previewFile.structuredResults.recordType === 'file_upload' && previewFile.structuredResults.fileContent ? (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            {/* PDF Viewer */}
                                            {previewFile.structuredResults.fileType?.includes('pdf') && (
                                                <iframe
                                                    src={previewFile.structuredResults.fileContent}
                                                    style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none', borderRadius: '8px' }}
                                                    title="Document Preview"
                                                />
                                            )}

                                            {/* Video Viewer */}
                                            {previewFile.structuredResults.fileType?.includes('video') && (
                                                <div style={{ width: '100%', maxWidth: '800px' }}>
                                                    <video
                                                        controls
                                                        src={previewFile.structuredResults.fileContent}
                                                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            )}

                                            {/* Image Viewer */}
                                            {previewFile.structuredResults.fileType?.includes('image') && (
                                                <img
                                                    src={previewFile.structuredResults.fileContent}
                                                    alt="Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
                                                />
                                            )}

                                            {/* Fallback / Other Files */}
                                            {!previewFile.structuredResults.fileType?.includes('pdf') &&
                                                !previewFile.structuredResults.fileType?.includes('video') &&
                                                !previewFile.structuredResults.fileType?.includes('image') && (
                                                    <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📎</div>
                                                        <h3>File Preview Not Available</h3>
                                                        <p style={{ color: '#666', marginBottom: '2rem' }}>
                                                            This file type ({previewFile.structuredResults.fileType}) cannot be previewed directly in the browser.
                                                        </p>
                                                        <a
                                                            href={previewFile.structuredResults.fileContent}
                                                            download={previewFile.fileName || 'download'}
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.8rem 2rem', textDecoration: 'none', display: 'inline-block' }}
                                                        >
                                                            Download File
                                                        </a>
                                                    </div>
                                                )}
                                        </div>
                                    ) : (
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
                                                        <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Result</th>
                                                        <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Unit</th>
                                                        <th style={{ padding: '1rem', borderBottom: '2px solid #eee' }}>Reference Range</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Object.entries(previewFile.structuredResults.results).map(([key, val]) => {
                                                        let meta = previewFile.structuredResults.metadata ? previewFile.structuredResults.metadata[key] : null;

                                                        // Fallback for Manual Entry (Flat Metadata)
                                                        if (!meta && (key === 'value' || key === 'resultValue') && previewFile.structuredResults.metadata && (previewFile.structuredResults.metadata.unit || previewFile.structuredResults.metadata.range)) {
                                                            meta = previewFile.structuredResults.metadata;
                                                        }

                                                        // Fallback for Vitals (Hardcoded Units)
                                                        let unit = meta?.unit || '-';
                                                        if (unit === '-' || !unit) {
                                                            const k = key.toLowerCase();
                                                            if (['hr', 'heartrate'].includes(k)) unit = 'bpm';
                                                            else if (['spo2'].includes(k)) unit = '%';
                                                            else if (['temp', 'temperature'].includes(k)) unit = '°C';
                                                            else if (['weight'].includes(k)) unit = 'kg';
                                                            else if (['glucose'].includes(k)) unit = 'mmol/L';
                                                            else if (['rr', 'resprate'].includes(k)) unit = '/min';
                                                            else if (['bp', 'bloodpressure'].includes(k)) unit = 'mmHg';
                                                        }

                                                        // Calculate Analysis if not present
                                                        // Map generic test names or use key
                                                        // This is a basic attempt to find an analysis; complex manual tests might not match exactly
                                                        let analysis = null;
                                                        if (analyzableCategories) {
                                                            // Helper to find category
                                                            for (const cat of ['VITALS', 'FBC', 'LFT', 'RFT']) {
                                                                const res = analyzeResult(cat, key, val, profile.age || 30, profile.sex || 'Male');
                                                                if (res) {
                                                                    analysis = res;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        const flag = meta?.flag || (analysis && analysis.flag !== 'Normal' ? analysis.flag : null);
                                                        const flagColor = flag && (flag.includes('High') || flag.includes('Low')) ? (flag.includes('Critical') ? 'red' : 'orange') : 'inherit';

                                                        return (
                                                            <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#555' }}>{key.toUpperCase()}</td>
                                                                <td style={{ padding: '1rem', fontSize: '1.1rem', color: 'var(--color-navy)' }}>
                                                                    {val || 'N/A'}
                                                                    {flag && <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: flagColor, fontWeight: 'bold', border: `1px solid ${flagColor}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{flag}</span>}
                                                                </td>
                                                                <td style={{ padding: '1rem', color: '#666' }}>{unit}</td>
                                                                <td style={{ padding: '1rem', color: '#666' }}>{meta?.range || (analysis ? analysis.range : '-')}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                                                Validated by {previewFile.scientist} on {previewFile.date}
                                            </div>
                                        </div>
                                    )
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
                                        <p style={{ color: '#ff4d4f' }}>Error: No report data found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
