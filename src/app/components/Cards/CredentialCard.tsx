import React from 'react';
import s from './CredentialCard.module.css';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface CredentialCardProps {
  credential: Credential;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({ credential }) => {
  return (
    <>
      <span className={s.box}>
        <span className={s.credentialKeyContainer}>
          <FontAwesomeIcon icon={faKey} />
        </span>
        <h4 className={s.title}>
          {credential.key}
        </h4>
      </span>
      {/* Maybe add a visibility toggle for the value here later */}
    </>
  );
};
