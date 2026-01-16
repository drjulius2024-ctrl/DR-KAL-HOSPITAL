import React, { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="glass-panel modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    {title && <h3 className="modal-title">{title}</h3>}
                    <button onClick={onClose} className="modal-close">&times;</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

export default Modal;
