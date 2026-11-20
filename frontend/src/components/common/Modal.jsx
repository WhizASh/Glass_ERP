import React, { useEffect, useId } from 'react';
import DialogHeader from './DialogHeader';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
  const titleId = useId();
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="app-dialog app-dialog-overlay z-50"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="app-dialog-backdrop"
      />

      <div className={`app-dialog-panel ${maxWidth}`}>
        <DialogHeader titleId={titleId} title={title} subtitle={subtitle} onClose={onClose} />

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
