import s from './ReadOnlyFields.module.css';
import React from 'react';

interface ReadOnlyFieldsProps {
  data: any;
  isNested?: boolean;
}

const Field: React.FC<{ fieldKey: string | number; fieldValue: any }> = ({ fieldKey, fieldValue }) => {
  const isArray = Array.isArray(fieldValue);

  const getValueClassName = (value: any) => {
    if (value === null) return s.nullValue;
    const type = typeof value;
    if (type === 'string') return s.stringValue;
    if (type === 'number') return s.numberValue;
    if (type === 'boolean') return s.booleanValue;
    return '';
  };

  const renderValue = () => {
    if (fieldValue === null) {
      return <span className={`${s.fieldValue} ${s.nullValue}`}>null</span>;
    }

    if (typeof fieldValue === 'object') {
      const isEmpty = isArray ? fieldValue.length === 0 : Object.keys(fieldValue).length === 0;

      if (isEmpty) {
        return <span className={s.emptyValue}>{isArray ? '[]' : '{}'}</span>;
      }

      return (
        <div className={s.nestedObject}>
          <ReadOnlyFields data={fieldValue} isNested />
        </div>
      );
    }

    // For primitives, render directly without extra quotes from JSON.stringify
    return <span className={`${s.fieldValue} ${getValueClassName(fieldValue)}`}>{String(fieldValue)}</span>;
  };

  return (
    <div className={s.fieldItem}>
      <span className={typeof fieldKey === 'number' ? s.arrayIndex : s.fieldKey}>{fieldKey}</span>
      {renderValue()}
    </div>
  );
};

export const ReadOnlyFields: React.FC<ReadOnlyFieldsProps> = ({ data, isNested = false }) => {
  const entries = Array.isArray(data) ? data.map((v, i) => [i, v]) : Object.entries(data);

  return (
    <div className={isNested ? '' : s.container}>
      {entries.map(([key, value]) => (
        <Field key={key} fieldKey={key} fieldValue={value} />
      ))}
    </div>
  );
};