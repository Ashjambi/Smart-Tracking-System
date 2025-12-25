
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title, size = '2xl' }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            modalRef.current?.focus();
            // منع التمرير في الخلفية عند فتح النافذة
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
    };

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={onClose}
        >
            <div
                ref={modalRef}
                className={`bg-brand-gray-dark rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-brand-gray-light text-white animate-in zoom-in-95 duration-300`}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-5 border-b border-brand-gray-light flex-shrink-0">
                    <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-400 rounded-full hover:bg-brand-gray hover:text-white transition-colors"
                        aria-label="إغلاق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
