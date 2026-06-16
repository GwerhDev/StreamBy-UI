import { ReactNode } from 'react';
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
}

export function ModalShell({ title, icon, onClose, children, footer, overlayClassName }: ModalShellProps) {
  return (
    <div className={`${s.overlay} ${overlayClassName ?? ''}`} onClick={onClose}>
      <div className={s.container} onClick={e => e.stopPropagation()}>
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
