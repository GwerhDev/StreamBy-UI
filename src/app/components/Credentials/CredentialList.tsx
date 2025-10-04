import React from 'react';
import styles from './CredentialList.module.css';

interface Credential {
  id: string;
  key: string;
  value: string;
}

interface CredentialListProps {
  credentials: Credential[];
}

const CredentialList: React.FC<CredentialListProps> = ({ credentials }) => {
  if (!credentials || credentials.length === 0) {
    return <p>No credentials found for this project.</p>;
  }

  return (
    <div className={styles.credentialList}>
      <h3>Existing Credentials</h3>
      <ul>
        {credentials.map((credential) => (
          <li key={credential.id} className={styles.credentialItem}>
            <strong>Key:</strong> {credential.key} <br />
            <strong>Value:</strong> {credential.value}
            {/* Add actions like edit/delete later */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CredentialList;
