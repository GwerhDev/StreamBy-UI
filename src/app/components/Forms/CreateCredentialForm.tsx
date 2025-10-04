import React, { useState } from 'react';
import styles from './CreateCredentialForm.module.css';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';

interface CreateCredentialFormProps {
  projectId: string;
  onCreate: (key: string, value: string) => void;
  loading: boolean;
}

const CreateCredentialForm: React.FC<CreateCredentialFormProps> = ({ projectId, onCreate, loading }) => {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key && value) {
      onCreate(key, value);
      setKey('');
      setValue('');
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <h3>Add New Credential</h3>
      <LabeledInput
        label="Key"
        name="key"
        value={key}
        type="text"
        placeholder="Enter credential key"
        id="credential-key"
        htmlFor="credential-key"
        onChange={(e) => setKey(e.target.value)}
        disabled={loading}
      />
      <LabeledInput
        label="Value"
        name="value"
        value={value}
        type="text"
        placeholder="Enter credential value"
        id="credential-value"
        htmlFor="credential-value"
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <PrimaryButton type="submit" text="Create Credential" disabled={loading} loader={loading} />
    </form>
  );
};

export default CreateCredentialForm;
