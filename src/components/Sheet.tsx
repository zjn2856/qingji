import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Sheet({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('input, button, select, textarea')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]');
      if (!elements?.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, []);
  return (
    <div className="sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={title} ref={panel}>
        <div className="sheet-handle" />
        <header className="sheet-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={23} /></button></header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, description, confirmText, onConfirm, onClose, danger = false }: {
  title: string; description: string; confirmText: string; onConfirm: () => void; onClose: () => void; danger?: boolean;
}) {
  return (
    <Sheet title={title} onClose={onClose} className="confirm-sheet">
      <p className="confirm-description">{description}</p>
      <div className="dialog-actions"><button className="button secondary" onClick={onClose}>取消</button><button className={`button ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>{confirmText}</button></div>
    </Sheet>
  );
}
