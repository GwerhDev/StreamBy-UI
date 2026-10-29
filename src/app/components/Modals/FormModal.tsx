import { MouseEvent, ReactNode, useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormDialogContext, InModalContext } from '../../../hooks/useFormRoute';
import s from './FormModal.module.css';

// A form opened as a modal over the screen it was opened from: the form is the modal (its own
// container, see CustomForm). Closed (its ×, outside it, Esc) it goes back to that screen, as
// Back does.
export function FormModal({ children }: { children: ReactNode }) {
  return (
    <InModalContext.Provider value>
      <FormModalOverlay>{children}</FormModalOverlay>
    </InModalContext.Provider>
  );
}

const FOCUSABLE = 'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([aria-label="Close"]), [href], [tabindex]:not([tabindex="-1"])';

function FormModalOverlay({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const close = useCallback(() => navigate(-1), [navigate]);
  const titleId = useId();
  const dialog = useMemo(() => ({ close, titleId }), [close, titleId]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pressedOutside = useRef(false);

  // Esc closes the form, unless something open in it took it first (a dropdown's list).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // Focus goes into the form as it opens, and back to what opened it as it closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const first = node?.querySelector<HTMLElement>(`[data-form-card] :is(${FOCUSABLE})`);
    (first ?? node)?.focus();
    return () => { if (opener?.isConnected) opener.focus(); };
  }, []);

  // Closed by a click outside it only when the press started outside it too: a text selection
  // dragged out of a field, or an option picked from a list over the overlay (its press is
  // inside, through the portal), is not one. What wraps the form lets the pointer through
  // (FormModal.module.css), so outside the form is the overlay itself.
  const onMouseDown = (e: MouseEvent) => { pressedOutside.current = e.target === e.currentTarget; };
  const onClick = (e: MouseEvent) => {
    if (pressedOutside.current && e.target === e.currentTarget) close();
    pressedOutside.current = false;
  };

  return (
    <div className={s.overlay} onMouseDown={onMouseDown} onClick={onClick} data-testid="form-modal">
      <FormDialogContext.Provider value={dialog}>
        <div ref={dialogRef} className={s.form} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
          {children}
        </div>
      </FormDialogContext.Provider>
    </div>
  );
}
