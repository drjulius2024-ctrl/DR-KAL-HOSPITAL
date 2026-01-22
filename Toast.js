"use client";
import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: '#dcfce7',
        error: '#fee2e2',
        info: '#e0f2fe',
        warning: '#fef9c3'
    };

    const textColors = {
        success: '#15803d',
        error: '#b91c1c',
        info: '#0369a1',
        warning: '#854d0e'
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: bgColors[type],
            color: textColors[type],
            padding: '1rem', // Increased padding
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${textColors[type]}`,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <span style={{ fontSize: '1.2rem' }}>
                {type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <span style={{ fontWeight: '500' }}>{message}</span>
            <button onClick={onClose} style={{
                background: 'transparent',
                border: 'none',
                color: 'currentColor',
                cursor: 'pointer',
                marginLeft: '0.5rem',
                fontSize: '1rem'
            }}>×</button>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Toast;
