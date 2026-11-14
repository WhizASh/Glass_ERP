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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-steel-950/50 backdrop-blur-xs transition-opacity"
      />

      {/* Solid Architectural Modal Box */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-xl border border-steel-200 shadow-2xl z-10 my-auto sm:my-6 overflow-hidden max-h-[calc(100dvh-1rem)] sm:max-h-[85vh] flex flex-col animate-in fade-in zoom-in-98 duration-150`}>
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-[#0f172a] text-white border-b border-slate-800 shrink-0 gap-2">
          <div className="min-w-0 pr-2">
            <h2 id="modal-title" className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] sm:text-[11px] text-steel-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-steel-400 hover:text-white hover:bg-steel-800 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
