import s from './IntegrationsInfo.module.css';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faPlugCircleCheck, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { IntegrationsInfoModal } from './IntegrationsInfoModal';

export const IntegrationsInfoButton: React.FC = () => {
  const { integrations, loading } = useSelector((state: RootState) => state.management);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const databaseEntries = integrations.filter(i => i.kind === 'database');
  const storageEntries = integrations.filter(i => i.kind === 'storage');
  const allConnected = databaseEntries.length > 0 && storageEntries.length > 0;
  const anyConnected = databaseEntries.length > 0 || storageEntries.length > 0;

  const getIcon = () => {
    if (loading) return <FontAwesomeIcon icon={faSpinner} spin className={s.icon} />;
    if (allConnected) return <FontAwesomeIcon icon={faGlobe} className={`${s.icon} ${s.iconConnected}`} />;
    if (anyConnected) return <FontAwesomeIcon icon={faPlugCircleCheck} className={`${s.icon} ${s.iconPartial}`} />;
    return <FontAwesomeIcon icon={faExclamationTriangle} className={`${s.icon} ${s.iconDisconnected}`} />;
  };

  const getTitle = () => {
    if (loading) return 'Loading integrations…';
    if (allConnected) return 'All integrations connected';
    if (anyConnected) return 'Some integrations connected';
    return 'No integrations connected';
  };

  return (
    <div className={s.container}>
      <button title={getTitle()} className={s.dbInfoButton} onClick={() => setIsModalOpen(v => !v)}>
        {getIcon()}
      </button>
      {isModalOpen && (
        <IntegrationsInfoModal
          databases={databaseEntries}
          storages={storageEntries}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
