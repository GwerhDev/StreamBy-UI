import React from 'react';
import { Database } from '../../../interfaces';
import s from './DbInfo.module.css';

interface DbInfoModalProps {
  databases: Database[];
}

export const DbInfoModal: React.FC<DbInfoModalProps> = ({ databases }) => {
  return (
    <div className={s.modalContent}>
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
