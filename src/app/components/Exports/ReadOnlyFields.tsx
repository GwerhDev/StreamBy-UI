import s from './ReadOnlyFields.module.css';
import React from 'react';

interface ReadOnlyFieldsProps {
  data: any;
}

const Field: React.FC<{ fieldKey: string | number; fieldValue: any }> = ({ fieldKey, fieldValue }) => {
  const renderValue = () => {
    if (typeof fieldValue === 'object' && fieldValue !== null) {
      return <div className={s.nestedObject}><ReadOnlyFields data={fieldValue} /></div>;
    }
    return <span className={s.fieldValue}>{String(fieldValue)}</span>;
  };

  return (
    <div className={s.fieldItem}>
      <span className={s.fieldKey}>{fieldKey}</span>
      {renderValue()}
    </div>
  );
};

export const ReadOnlyFields: React.FC<ReadOnlyFieldsProps> = ({ data }) => {
  const entries = Array.isArray(data) ? data.map((v, i) => [i, v]) : Object.entries(data);

  return (
    <div className={s.container}>
      {entries.map(([key, value]) => (
        <Field key={key} fieldKey={key} fieldValue={value} />
      ))}
    </div>
  );
};