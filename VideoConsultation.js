"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { ROLES } from '@/lib/auth_constants';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const VideoConsultation = ({ roomId, patientId, user }) => {
    // Backwards compatibility: use roomId or patientId
    const targetRoomId = roomId || patientId;

    const router = useRouter();
    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, incoming, connected, ended
    const [otherUser, setOtherUser] = useState(null);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();
    const socketRef = useRef();

    useEffect(() => {
        // Initialize Socket
        const socket = getSocket();
        if (!socket) return;

        socketRef.current = socket;

        // Join the specific video room (e.g. PatientID or ProfessionalID)
        socket.emit('join_room', targetRoomId);

        // Get Local Stream
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                setStream(currentStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = currentStream;
                }
            })
            .catch(err => {
                console.error("Error accessing media devices:", err);
                alert("Could not access camera/microphone");
            });

        // Socket Events
        socket.on('call-made', (data) => {
            // Incoming call
            setOtherUser({ id: data.from, name: data.name });
            setCallStatus('incoming');
            connectionRef.current = createPeerConnection(data.from);

            // Handle Offer
            const rtcSessionDescription = new RTCSessionDescription(data.signal);
            connectionRef.current.setRemoteDescription(rtcSessionDescription);
        });

        socket.on('answer-made', async (data) => {
            // Call answered
            const rtcSessionDescription = new RTCSessionDescription(data.signal);
            await connectionRef.current.setRemoteDescription(rtcSessionDescription);
            setCallStatus('connected');
        });

        socket.on('ice-candidate-received', (data) => {
            if (connectionRef.current) {
                connectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        });

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (connectionRef.current) {
                connectionRef.current.close();
            }
        };
    }, [targetRoomId]);

    const createPeerConnection = (partnerId) => {
        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, // Free STUN server
            ]
        });

        // Add Tracks
        if (stream) {
            stream.getTracks().forEach(track => peer.addTrack(track, stream));
        }

        // Handle Ice Candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: partnerId
                });
            }
        };

        // Handle Remote Stream
        peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            if (userVideo.current) {
                userVideo.current.srcObject = event.streams[0];
            }
        };

        return peer;
    };

    const callUser = async () => {
        const peer = createPeerConnection(targetRoomId); // Find peer by ID? 
        // Note: targetRoomId is the 'id' of the user we want to call (or room they are in). 
        // We broadcast to them.
        connectionRef.current = peer;

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        setCallStatus('calling');
        socketRef.current.emit('call-user', {
            userToCall: targetRoomId,
            signalData: offer,
            from: user.id,
            name: user.name
        });
    };

    const answerCall = async () => {
        const peer = connectionRef.current; // Created in 'call-made' event

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        setCallStatus('connected');

        socketRef.current.emit('make-answer', {
            signal: answer,
            to: otherUser.id
        });
    };

    const leaveCall = () => {
        setCallStatus('ended');
        if (connectionRef.current) {
            connectionRef.current.close();
        }
        router.push('/dashboard');
    };

    return (
        <div className="video-consultation-container p-4 h-full flex flex-col items-center justify-center bg-slate-900 text-white min-h-screen">
            <div className="absolute top-4 left-4 z-10">
                <Button variant="secondary" onClick={() => router.back()}>Back</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl flex-grow items-center">
                {/* My Video */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700">
                    <video playsInline muted ref={myVideo} autoPlay className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">
                        You ({user?.name})
                    </div>
                </div>

                {/* Remote Video */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    {remoteStream ? (
                        <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-4">
                            <div className="text-4xl mb-4">👤</div>
                            <p className="text-xl">
                                {callStatus === 'calling' ? 'Calling...' : (callStatus === 'incoming' ? `${otherUser?.name} is calling...` : 'Waiting for connection')}
                            </p>
                        </div>
                    )}
                    {callStatus === 'connected' && <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm">Remote User</div>}
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex gap-6">
                {callStatus === 'idle' && (
                    <Button variant="success" size="lg" onClick={callUser} className="px-8 py-4 rounded-full text-lg shadow-lg shadow-green-500/30">
                        📞 Start Call
                    </Button>
                )}
                {callStatus === 'incoming' && (
                    <Button variant="success" size="lg" onClick={answerCall} className="px-8 py-4 rounded-full text-lg animate-pulse">
                        Answer
                    </Button>
                )}
                <Button variant="danger" size="lg" onClick={leaveCall} className="px-8 py-4 rounded-full text-lg shadow-lg shadow-red-500/30">
                    End Call
                </Button>
            </div>
        </div>
    );
};

export default VideoConsultation;
