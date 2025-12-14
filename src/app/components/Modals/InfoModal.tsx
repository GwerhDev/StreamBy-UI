import React from 'react';
import s from './InfoModal.module.css';

interface InfoModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, onClose, children }) => {
  return (
    <div className={s.container} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          <button onClick={onClose} className={s.closeButton}>&times;</button>
        </div>
        <div className={s.content}>
          {children}
        </div>
      </div>
    </div>
  );
};
