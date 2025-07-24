import s from './DbInfo.module.css';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import { DbInfoModal } from './DbInfoModal';

export const DbInfoButton: React.FC = () => {
  const { databases } = useSelector((state: RootState) => state.management);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={s.container}>
      <button title={databases.length ? "Connected" : "Disconnected"} className={s.dbInfoButton} onClick={handleButtonClick}>
        <FontAwesomeIcon icon={faDatabase} className={s.icon} />
      </button>
      {isModalOpen && <DbInfoModal databases={databases} />}
    </div>
  );
};
