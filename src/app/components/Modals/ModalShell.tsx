import { MouseEvent, ReactNode, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import s from './ModalShell.module.css';

interface ModalShellProps {
  title: string;
  icon?: IconDefinition;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  overlayClassName?: string;
  className?: string;
}

export function ModalShell({ title, icon, onClose, children, footer, overlayClassName, className }: ModalShellProps) {
  // Closed by a click outside it only when the press started outside it too: a text selection
  // dragged out of one of its fields and released over the overlay is not one.
  const pressedOutside = useRef(false);
  const onMouseDown = (e: MouseEvent) => { pressedOutside.current = e.target === e.currentTarget; };
  const onClick = (e: MouseEvent) => {
    if (pressedOutside.current && e.target === e.currentTarget) onClose();
    pressedOutside.current = false;
  };

  return (
    <div className={`${s.overlay} ${overlayClassName ?? ''}`} onMouseDown={onMouseDown} onClick={onClick} data-testid="modal-overlay">
      <div className={`${s.container} ${className ?? ''}`}>
        <div className={s.header}>
          <span className={s.title}>
            {icon && <FontAwesomeIcon icon={icon} />}
            {title}
          </span>
          <button className={s.closeBtn} type="button" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>
  );
}
