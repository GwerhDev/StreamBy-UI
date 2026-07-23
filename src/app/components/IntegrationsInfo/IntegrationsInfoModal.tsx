import s from './IntegrationsInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { IntegrationPoolEntry } from '../../../interfaces';
import { fetchIntegrations } from '../../../store/managementSlice';
import { AppDispatch } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faDatabase, faCloud, faCircle } from '@fortawesome/free-solid-svg-icons';
import { LockedIntegrationBadge } from '../Integrations/LockedIntegrationBadge';
import streambyIcon from '../../../assets/streamby-icon.svg';

interface IntegrationsInfoModalProps {
  databases: IntegrationPoolEntry[];
  storages: IntegrationPoolEntry[];
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
    dispatch(fetchIntegrations());
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
              <li key={db.id} className={s.item}>
                <FontAwesomeIcon icon={faCircle} className={s.dot} />
                <span className={s.itemName}>{db.name}</span>
                <span className={s.itemValue}>{db.provider}</span>
                {db.source === 'builtin' && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
                {!db.available && <LockedIntegrationBadge requiredPlan={db.requiredPlan} />}
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
              <li key={st.id} className={s.item}>
                <FontAwesomeIcon icon={faCircle} className={s.dot} />
                <span className={s.itemName}>{st.name}</span>
                <span className={s.itemValue}>{st.provider}</span>
                {st.source === 'builtin' && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
                {!st.available && <LockedIntegrationBadge requiredPlan={st.requiredPlan} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
