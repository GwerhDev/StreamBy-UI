import { MouseEvent, ReactNode, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormCloseContext, InModalContext } from '../../../hooks/useFormRoute';
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

function FormModalOverlay({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const close = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  // The form's page wrapper fills the overlay: outside the form is outside its container.
  const onClick = (e: MouseEvent) => {
    if (!(e.target as Element).closest('[data-form-card]')) close();
  };

  return (
    <div className={s.overlay} onClick={onClick} data-testid="form-modal">
      <FormCloseContext.Provider value={close}>
        <div className={s.form}>{children}</div>
      </FormCloseContext.Provider>
    </div>
  );
}
