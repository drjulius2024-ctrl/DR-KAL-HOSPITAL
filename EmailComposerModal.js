"use client";
import { useState } from 'react';

export default function EmailComposerModal({ isOpen, onClose, recipientEmail, recipientName }) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipientEmail,
                    subject: subject,
                    text: body, // Plain text version
                    html: `<p>${body.replace(/\n/g, '<br>')}</p><br><hr><p>Sent from Dr. Kal's Virtual Hospital Official Portal</p>`
                })
            });

            const data = await res.json();

            if (data.success) {
                if (data.simulated) {
                    const reason = data.warning ? `\n\nReason: ${data.warning}` : '';
                    alert(`⚠️ Simulation Mode Active\n\nWe couldn't log in with your credentials, so we simulated the send.\n${reason}\n\nTip: Use a Gmail "App Password", not your main password.`);
                } else {
                    alert(`✅ Email sent successfully to ${recipientEmail}`);
                }
                onClose();
                setSubject('');
                setBody('');
            } else {
                alert(`❌ Failed to send email:\n${data.error}\n\nHint: ${data.hint || ''}`);
            }
        } catch (err) {
            alert('❌ Network error sending email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '600px', maxWidth: '90%', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Compose Official Email</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <form onSubmit={handleSend}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>To:</label>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                            {recipientName} &lt;{recipientEmail}&gt;
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Subject:</label>
                        <input
                            required
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            placeholder="Official Communication..."
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Message:</label>
                        <textarea
                            required
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            placeholder="Type your message here..."
                            rows={8}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'sans-serif' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#f1f5f9', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                        <button
                            type="submit"
                            disabled={sending}
                            style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: sending ? '#94a3b8' : '#2563eb', color: 'white', fontWeight: 'bold', cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {sending ? 'Sending...' : 'Send Official Mail'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
