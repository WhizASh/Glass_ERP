import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) => {
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
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-steel-950/50 backdrop-blur-xs transition-opacity"
      />

      {/* Solid Architectural Modal Box */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-6 overflow-hidden animate-in fade-in zoom-in-98 duration-150`}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-3.5 bg-[#0f172a] text-white border-b border-slate-800">
          <div>
            <h2 id="modal-title" className="text-sm font-bold text-white tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-steel-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[78vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
