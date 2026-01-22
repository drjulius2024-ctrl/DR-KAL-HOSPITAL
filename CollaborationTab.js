"use client";
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

let socket;

export default function CollaborationTab({ user, selectedPatientId }) {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // Initial connection and room joining
    useEffect(() => {
        // Initialize socket connection
        // Note: In Next.js dev mode, this might create multiple connections if not careful.
        // Moving socket init outside or using a singleton pattern is often preferred, 
        // but for this component lifecycle it should be fine with cleanup.

        if (!socket) {
            socket = io();
        }

        function onConnect() {
            setIsConnected(true);
            console.log('Connected to socket server');
            if (selectedPatientId) {
                socket.emit('join_room', selectedPatientId);
            }
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log('Disconnected from socket server');
        }

        function onReceiveMessage(msg) {
            setMessages(prev => [...prev, msg]);
            // Scroll to bottom when new message arrives
            setTimeout(() => scrollToBottom(), 100);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('receive_message', onReceiveMessage);

        // If socket is already connected (e.g. from previous mount or singleton), join room immediately
        if (socket.connected) {
            onConnect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('receive_message', onReceiveMessage);
            // We generally don't disconnect the global socket here if it's shared, 
            // but for this implementation we can leave it open or handle cleanup if needed.
        };
    }, [selectedPatientId]);

    // Handle patient change (room switching)
    useEffect(() => {
        if (socket && socket.connected && selectedPatientId) {
            // Re-emit join room when patient changes
            socket.emit('join_room', selectedPatientId);
            // Optionally clear messages or fetch history here
            setMessages([]);
        }
    }, [selectedPatientId]);

    // Scroll handling
    const scrollToBottom = (behavior = "smooth") => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        }
    };

    // Auto-scroll on initial render or when messages change
    useEffect(() => {
        scrollToBottom("smooth");
    }, [messages]);

    const handleImageLoad = () => {
        scrollToBottom();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setAttachment({
                name: file.name,
                type: file.type,
                data: reader.result,
                size: (file.size / 1024).toFixed(1) + ' KB'
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSendMessage = () => {
        if (!message.trim() && !attachment) return;

        const newMessage = {
            id: Date.now().toString(), // Simple ID generation
            sender: user.name,
            role: user.role,
            text: message,
            attachment: attachment,
            patientId: selectedPatientId,
            timestamp: new Date().toISOString()
        };

        // Emit to server
        if (socket) {
            socket.emit('send_message', newMessage);
        }

        // Optimistically update UI? 
        // We'll rely on the server broadcast ('receive_message') which includes 'self' in our server implementation.
        // If server implementation excludes sender, we would add it here.
        // Current server.js implementation: io.to(data.patientId).emit(...) -> broadcasts to everyone in room including sender.

        setMessage('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = (id) => {
        // Delete logic would need server support (emit 'delete_message').
        // For now, we'll just filter locally for the user, but ideally this should be broadcasted too.
        if (confirm('Delete this message locally? (Server sync pending)')) {
            setMessages(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const renderAttachment = (att) => {
        if (!att) return null;

        if (att.type.startsWith('image/')) {
            return (
                <div className="mt-2">
                    <img
                        src={att.data}
                        alt={att.name}
                        onLoad={handleImageLoad}
                        className="chat-attachment-img"
                        onClick={() => window.open(att.data)}
                    />
                </div>
            );
        }

        if (att.type.startsWith('video/')) {
            return (
                <div className="mt-2">
                    <video controls className="chat-attachment-video">
                        <source src={att.data} type={att.type} />
                    </video>
                </div>
            );
        }

        return (
            <div className="chat-attachment-file" onClick={() => window.open(att.data)}>
                <span className="file-icon">{att.type === 'application/pdf' ? '📄' : '📎'}</span>
                <div className="file-info">
                    <div className="file-name">{att.name}</div>
                    <div className="file-meta">{att.size}</div>
                </div>
            </div>
        );
    };

    const careTeam = [
        { name: 'Dr. Sarah', role: 'Cardiology', active: true },
        { name: 'Nurse Joy', role: 'ICU', active: false },
        { name: 'Mark', role: 'Pharmacist', active: false },
        { name: 'Dr (Mls) White', role: 'Pathology', active: true },
        { name: user.name, role: user.role, active: true, isSelf: true }
    ];

    return (
        <Card className="collaboration-card">
            {/* Care Team Sidebar */}
            <div className="collab-sidebar">
                <h4 className="collab-section-title">Care Team</h4>
                <div className="care-team-list">
                    {careTeam.map((member, idx) => (
                        <div key={idx} className={`care-team-item ${member.isSelf ? 'self' : ''}`}>
                            <div className="care-team-avatar-wrapper">
                                <div className="care-team-avatar">
                                    {member.name.charAt(0)}
                                </div>
                                <div className={`care-team-status ${member.active ? 'active' : ''}`}></div>
                            </div>
                            <div>
                                <div className="font-bold text-sm">{member.name} {member.isSelf && '(You)'}</div>
                                <div className="text-xs text-slate-500">{member.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-auto pt-4 text-xs text-slate-400 text-center">
                    {isConnected ? '🟢 Live Connection' : '🔴 Reconnecting...'}
                </div>
            </div>

            {/* Chat Space */}
            <div className="chat-area">
                <div className="chat-messages" ref={scrollContainerRef}>
                    {messages.length === 0 ? (
                        <div className="chat-empty-state">
                            <div className="text-3xl mb-4">💬</div>
                            <p>No messages in this session. Start the clinical discussion.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isSelf = msg.sender === user.name;
                            return (
                                <div key={msg.id} className={`chat-msg-container ${isSelf ? 'self' : ''}`}>
                                    <div className="chat-msg-header">
                                        <span>{msg.sender} • {msg.role}</span>
                                        {isSelf && (
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="chat-delete-btn"
                                                title="Delete Message"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                    <div className="chat-msg-bubble">
                                        {msg.text}
                                        {renderAttachment(msg.attachment)}
                                    </div>
                                    <div className="chat-timestamp">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-area">
                    {attachment && (
                        <div className="attachment-preview">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{attachment.type.startsWith('image/') ? '🖼️' : attachment.type.startsWith('video/') ? '🎥' : '📄'}</span>
                                <span className="text-sm font-bold">{attachment.name} ({attachment.size})</span>
                            </div>
                            <button onClick={() => setAttachment(null)} className="attachment-close-btn">✕</button>
                        </div>
                    )}
                    <div className="chat-controls">
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            accept="image/*,video/*,application/pdf"
                        />
                        <Button
                            variant="secondary"
                            className="px-2 text-xl rounded-lg"
                            onClick={() => fileInputRef.current.click()}
                            title="Attach Image, PDF, or Video"
                        >
                            📎
                        </Button>
                        <Input
                            type="text"
                            placeholder="Share clinical insights or ask the team..."
                            className="m-0 rounded-lg h-auto"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            fullWidth
                        />
                        <Button
                            variant="primary"
                            className="px-6 rounded-lg"
                            onClick={handleSendMessage}
                        >
                            Send
                        </Button>
                    </div>
                    <p className="chat-helper-text">Supports: Images, PDF documents, and MP4 videos.</p>
                </div>
            </div>
        </Card>
    );
}
