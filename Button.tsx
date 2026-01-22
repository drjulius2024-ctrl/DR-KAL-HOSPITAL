import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
}

export function Button({ children, variant = 'primary', size = 'medium', className = '', ...props }: ButtonProps) {
    const baseStyles = "btn";
    const variantStyles = variant === 'secondary' ? 'btn-secondary' :
        variant === 'danger' ? 'btn-danger' :
            'btn-primary';

    // Size handling could be added here if CSS supported it, currently relying on class

    return (
        <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
            {children}
        </button>
    );
}

export default Button;
