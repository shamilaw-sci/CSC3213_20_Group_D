/**
 * @file Modal.jsx
 * @module Components
 * @desc Shared accessible modal component.
 * @author Wasana Karunanayaka (S/21/081)
 */

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * @component Modal
 * @desc      Reusable modal dialog with overlay and close button.
 *            Used across all Care4U pages for detail views and forms.
 * @author    Wasana Karunanayaka (S/21/081)
 * @param {boolean} manageFocus Opt-in Escape, focus trap/restore and scrollable viewport.
 * @param {boolean}  isOpen  - Controls visibility
 * @param {Function} onClose - Called when overlay or X is clicked
 * @param {string}   title   - Modal heading
 * @param {node}     children - Modal body content
 * @param {string}   size    - sm | md | lg
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md', manageFocus = false }) => {
  const dialog = useRef(null);
  const titleId = useId();
  const closeHandler = useRef(onClose);
  useEffect(() => { closeHandler.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!isOpen || !manageFocus) return undefined;
    const previous = document.activeElement;
    const root = dialog.current;
    root?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeHandler.current(); }
      if (event.key !== 'Tab') return;
      const items = [...(root?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || [])].filter(item => item.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); root?.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === root)) { event.preventDefault(); first.focus(); }
    };
    root?.addEventListener('keydown', onKeyDown);
    return () => { root?.removeEventListener('keydown', onKeyDown); if (previous?.isConnected) previous.focus(); };
  }, [isOpen, manageFocus]);
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

      {/* Auth/patient consumers opt in to focus containment and scrollable dialog content. */}
      <div
        ref={dialog} role={manageFocus ? "dialog" : undefined} aria-modal={manageFocus || undefined} aria-labelledby={manageFocus ? titleId : undefined} tabIndex={manageFocus ? -1 : undefined}
        className={`${manageFocus ? "max-h-[90dvh] overflow-y-auto " : ""}relative z-10 w-full ${sizes[size]} bg-card rounded-xl shadow-xl border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 id={titleId} className="text-lg font-bold text-foreground">{title}</h2>
          <button
            type="button" aria-label="Close dialog"
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
