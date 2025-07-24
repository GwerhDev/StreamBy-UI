import s from './DbInfo.module.css';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { DbInfoModal } from './DbInfoModal';

export const DbInfoButton: React.FC = () => {
  const { databases, loading } = useSelector((state: RootState) => state.management);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getIcon = () => {
    if (loading) {
      return <FontAwesomeIcon icon={faSpinner} spin className={s.icon} />;
    } else if (databases.length > 0) {
      return <FontAwesomeIcon icon={faGlobe} className={s.icon} />;
    } else {
      return <FontAwesomeIcon icon={faExclamationTriangle} className={s.icon} />;
    }
  };

  const getTitle = () => {
    if (loading) {
      return "Loading...";
    } else if (databases.length > 0) {
      return "Connected";
    } else {
      return "Disconnected";
    }
  };

  return (
    <div className={s.container}>
      <button title={getTitle()} className={s.dbInfoButton} onClick={handleButtonClick}>
        {getIcon()}
      </button>
      {isModalOpen && <DbInfoModal databases={databases} onClose={handleCloseModal} />}
    </div>
  );
};

