"use client";
import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import PatientAutofillInputs from './ui/PatientAutofillInputs';
import WhatsAppButton from './WhatsAppButton';
import DictationRecorder from './DictationRecorder';
import VideoConsultation from './VideoConsultation';

export default function CommunicationHub({
    user,
    patients = [], // List of patients for autofill/lookup
    staff = [],    // List of staff/professionals
    initialPatientId = null, // Optional initial patient
    onPatientSelect // Optional callback when patient changes
}) {
    const [targetType, setTargetType] = useState('patient'); // 'patient' or 'staff'
    const [selectedTargetId, setSelectedTargetId] = useState(initialPatientId);
    const [selectedTargetName, setSelectedTargetName] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showVideoConsultation, setShowVideoConsultation] = useState(false);

    // Sync local state if prop changes
    useEffect(() => {
        if (initialPatientId) {
            setSelectedTargetId(initialPatientId);
            setTargetType('patient'); // Default to patient if ID provided initially
        }
    }, [initialPatientId]);

    // Find the full target object
    const sourceList = targetType === 'patient' ? patients : staff;
    const selectedTarget = sourceList.find(p => p.id === selectedTargetId) || (targetType === 'patient' ? patients.find(p => p.pathNumber === selectedTargetId) : null);

    // Sync name if target is found
    useEffect(() => {
        if (selectedTarget) {
            setSelectedTargetName(selectedTarget.name);
        } else {
            setSelectedTargetName('');
        }
    }, [selectedTarget]);

    const fetchMessages = async () => {
        if (!selectedTargetId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        try {
            // API currently optimized for patient-user messages. 
            // For staff-staff, we might need a different query or the same if backend supports generic 'recipientId'.
            // Assuming /api/messages supports generic recipientId for now, or just fetches based on ID.
            const res = await fetch(`/api/messages?patientId=${selectedTargetId}&userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMessages(data);
                } else {
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

    // Auto-fetch messages when target selected
    useEffect(() => {
        if (selectedTargetId) {
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [selectedTargetId]);

    const handleSendMessage = async () => {
        const content = document.getElementById('comm-hub-msg-content').value;
        const typeInput = document.querySelector('input[name="comm-hub-msg-type"]:checked');
        const type = typeInput ? typeInput.nextSibling.textContent.trim().toUpperCase() : 'SMS';

        if (!content) return alert("Please enter a message");
        if (!selectedTarget) return alert("Select a recipient first");

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: selectedTarget.id,
                    recipientName: selectedTarget.name,
                    recipientPhone: selectedTarget.phoneNumber,
                    recipientEmail: selectedTarget.email,
                    content,
                    type
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Message sent via ${type}!`);
                document.getElementById('comm-hub-msg-content').value = '';
                fetchMessages();
            } else {
                alert('Failed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error sending message');
        }
    };

    return (
        <Card>
            <h3>Communication Hub 📨</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Connect with patients and staff via multiple channels.</p>

            {showVideoConsultation ? (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, background: 'black' }}>
                    <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10000 }}>
                        <Button variant="danger" onClick={() => setShowVideoConsultation(false)}>Close Video</Button>
                    </div>
                    {/* Pass User to join room with correct ID */}
                    <VideoConsultation roomId={selectedTargetId} user={user} />
                </div>
            ) : (
                <div className="comm-hub-grid">
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <label style={{ cursor: 'pointer', fontWeight: 'bold', color: targetType === 'patient' ? '#2563eb' : '#666' }}>
                                    <input type="radio" checked={targetType === 'patient'} onChange={() => { setTargetType('patient'); setSelectedTargetId(null); }} /> Patient
                                </label>
                                <label style={{ cursor: 'pointer', fontWeight: 'bold', color: targetType === 'staff' ? '#7c3aed' : '#666' }}>
                                    <input type="radio" checked={targetType === 'staff'} onChange={() => { setTargetType('staff'); setSelectedTargetId(null); }} /> Staff
                                </label>
                            </div>

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select {targetType === 'patient' ? 'Patient' : 'Staff Member'}</label>

                            {targetType === 'patient' ? (
                                <PatientAutofillInputs
                                    patientName={selectedTargetName}
                                    setPatientName={setSelectedTargetName}
                                    patientId={selectedTargetId || ''}
                                    setPatientId={setSelectedTargetId}
                                />
                            ) : (
                                <select
                                    value={selectedTargetId || ''}
                                    onChange={(e) => setSelectedTargetId(e.target.value)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}
                                >
                                    <option value="">-- Select Staff Member --</option>
                                    {staff.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Communication Actions - Always Visible (Disabled if no target) */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            opacity: selectedTarget ? 1 : 0.5,
                            pointerEvents: selectedTarget ? 'auto' : 'none',
                            transition: 'opacity 0.3s'
                        }}>
                            {/* WhatsApp */}
                            <Card
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: '2px solid #22c55e', background: '#f0fdf4', transition: 'transform 0.2s' }}
                                onClick={() => {
                                    if (!selectedTarget) return;
                                    const number = selectedTarget.whatsappNumber || selectedTarget.phoneNumber;
                                    const cleanNumber = number.replace(/\D/g, '');
                                    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hello ${selectedTarget.name}, this is ${user.name} from Dr. Kal's Virtual Hospital.`)}`, '_blank');
                                }}
                            >
                                <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>📱</div>
                                <div style={{ fontWeight: 'bold', color: '#15803d' }}>WhatsApp Chat/Call</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Direct Link</div>
                            </Card>

                            {/* Mobile Call */}
                            <Card
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: '2px solid #3b82f6', background: '#eff6ff', transition: 'transform 0.2s' }}
                                onClick={() => selectedTarget && (window.location.href = `tel:${selectedTarget.phoneNumber}`)}
                            >
                                <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>📞</div>
                                <div style={{ fontWeight: 'bold', color: '#1d4ed8' }}>Mobile Network Call</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Voice Call</div>
                            </Card>

                            {/* Telehealth Room */}
                            <Card
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: '2px solid #a855f7', background: '#f3e8ff', transition: 'transform 0.2s' }}
                                onClick={() => selectedTarget && setShowVideoConsultation(true)}
                            >
                                <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🩺</div>
                                <div style={{ fontWeight: 'bold', color: '#7e22ce' }}>Telehealth Video Room</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Secure Session</div>
                            </Card>

                            {/* Video Call */}
                            <Card
                                style={{ padding: '1.5rem', textAlign: 'center', cursor: 'pointer', border: '2px solid #f59e0b', background: '#fffbeb', transition: 'transform 0.2s' }}
                                onClick={() => selectedTarget && setShowVideoConsultation(true)}
                            >
                                <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>📹</div>
                                <div style={{ fontWeight: 'bold', color: '#b45309' }}>Quick Video Call</div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>Instant Connection</div>
                            </Card>

                            {/* Voice Note */}
                            <Card style={{ padding: '1.5rem', textAlign: 'center', border: '2px solid #ec4899', background: '#fdf2f8' }}>
                                <div style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>🎤</div>
                                <div style={{ fontWeight: 'bold', color: '#be185d', marginBottom: '0.5rem' }}>Dictation</div>
                                <DictationRecorder onTranscriptionComplete={(text) => {
                                    const el = document.getElementById('comm-hub-msg-content');
                                    if (el) el.value += `\n[Voice Note]: ${text}`;
                                }} />
                            </Card>
                        </div>
                        {!selectedTarget && (
                            <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                                👆 Select a patient or staff member above to enable communication tools.
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message Type</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" name="comm-hub-msg-type" defaultChecked /> SMS
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" name="comm-hub-msg-type" /> Email
                                </label>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Message</label>
                            <textarea
                                id="comm-hub-msg-content"
                                className="input-field"
                                rows="5"
                                placeholder={`Message to ${selectedTarget ? selectedTarget.name : 'recipient'}...`}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
                            ></textarea>
                        </div>

                        <Button variant="primary" onClick={handleSendMessage}>Send Message</Button>
                    </div>

                    <Card style={{ background: '#f8fafc', maxHeight: '600px', overflowY: 'auto', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Inbox & History</h4>
                            <Button variant="secondary" size="sm" onClick={fetchMessages}>↻ Refresh</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {loadingMessages ? (
                                <p style={{ fontSize: '0.9rem', color: '#888' }}>Loading conversation...</p>
                            ) : messages.length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: '#888', fontStyle: 'italic' }}>No message history with this recipient.</p>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} style={{
                                        padding: '0.8rem',
                                        background: msg.senderId === user.id ? '#eff6ff' : 'white',
                                        borderRadius: '8px',
                                        border: msg.senderId === user.id ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                                        alignSelf: msg.senderId === user.id ? 'flex-end' : 'flex-start',
                                        maxWidth: '90%',
                                        marginLeft: msg.senderId === user.id ? 'auto' : '0'
                                    }}>
                                        <div style={{ fontSize: '0.9rem' }}>{msg.content}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.4rem', textAlign: 'right' }}>
                                            {msg.type} • {new Date(msg.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </Card>
    );
}
