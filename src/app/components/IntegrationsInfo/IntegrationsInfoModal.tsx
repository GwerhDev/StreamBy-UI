import s from './IntegrationsInfo.module.css';
import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsRotate, faDatabase, faCloud, faCircle, faPlug } from '@fortawesome/free-solid-svg-icons';
import { LockedIntegrationBadge } from '../Integrations/LockedIntegrationBadge';
import streambyIcon from '../../../assets/streamby-icon.svg';

// One of the project's connections, as listed here.
export interface IntegrationInfoEntry {
  id: string;
  name: string;
  provider: string;
  builtin: boolean;
  // A built-in the project's plan no longer reaches: listed, locked.
  available: boolean;
  requiredPlan?: string;
}

interface IntegrationsInfoModalProps {
  databases: IntegrationInfoEntry[];
  storages: IntegrationInfoEntry[];
  services: IntegrationInfoEntry[];
  onRefresh: () => void;
  onClose: () => void;
}

export const IntegrationsInfoModal: React.FC<IntegrationsInfoModalProps> = ({ databases, storages, services, onRefresh, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className={s.modal} ref={modalRef}>
      <div className={s.modalHeader}>
        <span className={s.modalTitle}>Integrations</span>
        <button type="button" className={s.refreshBtn} title="Refresh" onClick={onRefresh}>
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
                {db.builtin && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
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
                {st.builtin && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
                {!st.available && <LockedIntegrationBadge requiredPlan={st.requiredPlan} />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {services.length > 0 && (
        <>
          <div className={s.divider} />

          <div className={s.section}>
            <div className={s.sectionHeader}>
              <FontAwesomeIcon icon={faPlug} className={s.sectionIcon} />
              <span className={s.sectionTitle}>Services</span>
              <span className={s.sectionCount}>{services.length}</span>
            </div>
            <ul className={s.list}>
              {services.map(svc => (
                <li key={svc.id} className={s.item}>
                  <FontAwesomeIcon icon={faCircle} className={s.dot} />
                  <span className={s.itemName}>{svc.name}</span>
                  <span className={s.itemValue}>{svc.provider}</span>
                  {svc.builtin && <img src={streambyIcon} alt="Built-in" className={s.builtinIcon} title="Built-in" />}
                  {!svc.available && <LockedIntegrationBadge requiredPlan={svc.requiredPlan} />}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
