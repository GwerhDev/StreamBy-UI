import s from './DbInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Database } from '../../../interfaces';
import { fetchDatabases } from '../../../store/managementSlice';
import { AppDispatch } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';

interface DbInfoModalProps {
  databases: Database[];
  onClose: () => void;
}

export const DbInfoModal: React.FC<DbInfoModalProps> = ({ databases, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

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

  const handleRefresh = () => {
    dispatch(fetchDatabases());
  };

  return (
    <div className={s.modalContent} ref={modalRef}>
      <div className={s.header}>
        <h4>Connected Databases</h4>
        <FontAwesomeIcon icon={faRefresh} size='sm' onClick={handleRefresh} className={s.refreshButton} />
      </div>
      {databases.length === 0 ? (
        <p>No databases connected.</p>
      ) : (
        <ul>
          {databases.map((db) => (
            <li key={db.value}>
              <strong>{db.name}</strong> <small>({db.value})</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
