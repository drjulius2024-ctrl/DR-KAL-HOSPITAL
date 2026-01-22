"use client";
import React, { useState, useEffect } from 'react';
import { Card, Button } from '@/components/ui';

export default function EngagementTab({ user, patients, selectedPatientId, setSelectedPatientId }) {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msgContent, setMsgContent] = useState('');
    const [msgType, setMsgType] = useState('SMS');

    const selectedPatient = patients.find(p => p.id === selectedPatientId);

    useEffect(() => {
        if (selectedPatientId) {
            fetchMessages();
        } else {
            setMessages([]);
        }
    }, [selectedPatientId]);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?patientId=${selectedPatientId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const sendMessage = async (overrideType = null) => {
        if (!msgContent && !overrideType) return alert("Please enter a message");
        if (!selectedPatient) return alert("Select a patient");

        const typeToSend = overrideType || msgType;
        const contentToSend = msgContent;

        setLoading(true);
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: selectedPatient.id,
                    recipientName: selectedPatient.name,
                    recipientPhone: selectedPatient.phoneNumber || selectedPatient.profile?.phoneNumber,
                    recipientEmail: selectedPatient.email,
                    content: contentToSend,
                    type: typeToSend
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Message sent via ${typeToSend}!`);
                setMsgContent('');
                fetchMessages(); // Refresh history
            } else {
                alert('Failed: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error sending message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Patient Engagement Hub</h3>
                <div className="flex gap-2">
                    <Button variant="danger" onClick={() => {
                        const reason = prompt("Enter Emergency Alert Message for Patient:");
                        if (reason) {
                            setMsgContent(reason);
                            sendMessage('ALERT');
                        }
                    }}>
                        📢 Send Emergency Alert
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Compose */}
                <div className="col-span-1">
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="block text-sm font-bold mb-2">Select Patient</label>
                        <select
                            className="input-field w-full"
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                            <option value="">-- Select Patient --</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                            ))}
                        </select>
                    </div>

                    {selectedPatient && (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="block text-sm font-bold mb-2">Channel</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="msgType"
                                            checked={msgType === 'SMS'}
                                            onChange={() => setMsgType('SMS')}
                                        />
                                        SMS 📱
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="msgType"
                                            checked={msgType === 'EMAIL'}
                                            onChange={() => setMsgType('EMAIL')}
                                        />
                                        Email 📧
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label className="block text-sm font-bold mb-2">Message</label>
                                <textarea
                                    className="input-field w-full p-2 border rounded"
                                    rows="5"
                                    value={msgContent}
                                    onChange={(e) => setMsgContent(e.target.value)}
                                    placeholder={`Type your message to ${selectedPatient.name}...`}
                                ></textarea>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => sendMessage()}
                                disabled={loading || !msgContent}
                            >
                                {loading ? 'Sending...' : 'Send Message 🚀'}
                            </Button>
                        </>
                    )}
                </div>

                {/* Right: History */}
                <div className="col-span-2">
                    <Card style={{ background: '#f8fafc', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h4 className="mb-4">Communication History</h4>
                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
                            {messages.length === 0 ? (
                                <p className="text-gray-500 italic text-center mt-10">No recent messages.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {messages.map((msg) => {
                                        const isMe = msg.senderId === user.id;
                                        return (
                                            <div key={msg.id} style={{
                                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                maxWidth: '80%',
                                                background: isMe ? '#dbeafe' : '#ffffff',
                                                border: '1px solid #e2e8f0',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-700">
                                                        {isMe ? 'You' : msg.senderName}
                                                        {msg.type === 'ALERT' && <span className="text-red-600 ml-2">⚠️ ALERT</span>}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(msg.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800">{msg.content}</p>
                                                <div className="text-xs text-gray-400 mt-1 uppercase text-right">
                                                    via {msg.type}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </Card>
    );
}
