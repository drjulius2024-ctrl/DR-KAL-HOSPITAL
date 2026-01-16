import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export function Input({ label, error, fullWidth = false, className = '', ...props }: InputProps) {
    return (
        <div className={`input-wrapper ${fullWidth ? 'w-full' : 'w-auto'}`}>
            {label && <label className="input-label">{label}</label>}
            <input
                className={`input-field ${className} ${error ? 'input-field-error' : ''} ${fullWidth ? 'w-full' : ''}`}
                {...props}
            />
            {error && <span className="input-error-msg">{error}</span>}
        </div>
    );
}

export default Input;
