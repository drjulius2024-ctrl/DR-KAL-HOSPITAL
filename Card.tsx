import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export function Card({ children, className = '', title, ...props }: CardProps) {
    return (
        <div className={`card ${className}`} {...props}>
            {title && <h3 className="card-title">{title}</h3>}
            {children}
        </div>
    );
}

export default Card;
