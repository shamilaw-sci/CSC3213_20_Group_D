/**
 * @file Modal.jsx
 * @module Components
 * @desc Shared accessible modal component.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { X } from 'lucide-react';

/**
 * @component Modal
 * @desc      Reusable modal dialog with overlay and close button.
 *            Used across all Care4U pages for detail views and forms.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {boolean}  isOpen  - Controls visibility
 * @param {Function} onClose - Called when overlay or X is clicked
 * @param {string}   title   - Modal heading
 * @param {node}     children - Modal body content
 * @param {string}   size    - sm | md | lg
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-brand-deep/60 backdrop-blur-sm" />

      {/* Modal Box */}
      <div
        className={`relative z-10 w-full ${sizes[size]} bg-card rounded-xl shadow-xl border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
