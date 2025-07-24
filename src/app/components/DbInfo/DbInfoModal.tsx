import React, { useEffect, useRef } from 'react';
import { Database } from '../../../interfaces';
import s from './DbInfo.module.css';

interface DbInfoModalProps {
  databases: Database[];
  onClose: () => void;
}

export const DbInfoModal: React.FC<DbInfoModalProps> = ({ databases, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className={s.modalContent} ref={modalRef}>
      <h4>Connected Databases</h4>
      {databases.length === 0 ? (
        <p>No databases connected.</p>
      ) : (
        <ul>
          {databases.map((db) => (
            <li key={db.value}>
              <strong>{db.name}</strong> ({db.value})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
