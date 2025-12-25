
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-brand-gray/90 backdrop-blur-sm rounded-lg shadow-xl border border-brand-gray-light p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
