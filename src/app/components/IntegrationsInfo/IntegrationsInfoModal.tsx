import s from './IntegrationsInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Database, CloudStorage } from '../../../interfaces';
import { fetchDatabases, fetchStorages } from '../../../store/managementSlice';
import { AppDispatch } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faDatabase, faCloud, faCircle } from '@fortawesome/free-solid-svg-icons';

interface IntegrationsInfoModalProps {
  databases: Database[];
  storages: CloudStorage[];
  onClose: () => void;
}

export const IntegrationsInfoModal: React.FC<IntegrationsInfoModalProps> = ({ databases, storages, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleRefresh = () => {
    dispatch(fetchDatabases());
    dispatch(fetchStorages());
  };

  return (
    <div className={s.modal} ref={modalRef}>
      <div className={s.modalHeader}>
        <span className={s.modalTitle}>Integrations</span>
        <button type="button" className={s.refreshBtn} title="Refresh" onClick={handleRefresh}>
          <FontAwesomeIcon icon={faArrowsRotate} />
        </button>
      </div>

      <div className={s.section}>
        <div className={s.sectionHeader}>
          <FontAwesomeIcon icon={faDatabase} className={s.sectionIcon} />
          <span className={s.sectionTitle}>Databases</span>
          <span className={s.sectionCount}>{databases.length}</span>
        </div>
        {databases.length === 0 ? (
          <p className={s.empty}>No databases connected.</p>
        ) : (
          <ul className={s.list}>
            {databases.map(db => (
              <li key={db.value} className={s.item}>
                <FontAwesomeIcon icon={faCircle} className={s.dot} />
                <span className={s.itemName}>{db.name}</span>
                <span className={s.itemValue}>{db.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={s.divider} />

      <div className={s.section}>
        <div className={s.sectionHeader}>
          <FontAwesomeIcon icon={faCloud} className={s.sectionIcon} />
          <span className={s.sectionTitle}>Storage</span>
          <span className={s.sectionCount}>{storages.length}</span>
        </div>
        {storages.length === 0 ? (
          <p className={s.empty}>No storage connected.</p>
        ) : (
          <ul className={s.list}>
            {storages.map(st => (
              <li key={st.value} className={s.item}>
                <FontAwesomeIcon icon={faCircle} className={s.dot} />
                <span className={s.itemName}>{st.name}</span>
                <span className={s.itemValue}>{st.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
