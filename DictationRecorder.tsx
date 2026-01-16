import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface DictationRecorderProps {
    onSave: (note: string) => void;
    placeholder?: string;
    label?: string;
}

export default function DictationRecorder({ onSave, placeholder = 'Dictate clinical note...', label = 'Dictation' }: DictationRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [note, setNote] = useState('');

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            // In a real app, this would stop the SpeechRecognition API
        } else {
            setIsRecording(true);
            setNote(prev => prev + (prev ? ' ' : '') + "Patient presents with... [Simulated Dictation]");
        }
    };

    const handleSave = () => {
        if (!note.trim()) {
            alert("No text to save.");
            return;
        }
        onSave(note);
        setNote('');
        setIsRecording(false);
    };

    return (
        <div className="recorder-container">
            {isRecording && (
                <div className="recording-indicator">
                    🔴 Recording: {note}...
                </div>
            )}

            <Button
                variant={isRecording ? 'danger' : 'secondary'}
                size="small"
                onClick={toggleRecording}
            >
                {isRecording ? '⏹ Stop' : '🎤 Dictate'}
            </Button>

            <Button
                variant="primary"
                size="small"
                onClick={handleSave}
            >
                + Save Note
            </Button>
        </div>
    );
}
