import s from './FormInputMode.module.css';
import React from 'react';
import { LabeledInput } from '../Inputs/LabeledInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';

// Props for the main component
interface FormInputModeProps {
  jsonData: any;
  onJsonDataChange: (newData: any) => void;
}

// Props for the recursive field component
interface JsonFieldProps {
  fieldKey: string | number;
  fieldValue: any;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: any) => void;
  onDelete: (path: (string | number)[]) => void;
  onKeyChange: (path: (string | number)[], newKey: string) => void;
}

const JsonField: React.FC<JsonFieldProps> = ({
  fieldKey,
  fieldValue,
  path,
  onUpdate,
  onDelete,
  onKeyChange,
}) => {
  const currentPath = [...path, fieldKey];
  const isArrayItem = typeof fieldKey === 'number';

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value: any = e.target.value;
    if (e.target.type === 'checkbox') {
      value = e.target.checked;
    } else if (e.target.type === 'number') {
      const num = parseFloat(e.target.value);
      value = isNaN(num) ? e.target.value : num;
    }
    onUpdate(currentPath, value);
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onKeyChange(currentPath, e.target.value);
  };

  const renderValueInput = () => {
    const type = typeof fieldValue;
    if (type === 'boolean') {
      return (
        <div className={s.checkboxContainer}>
          <input
            type="checkbox"
            checked={fieldValue}
            onChange={handleValueChange}
          />
          <label>{String(fieldValue)}</label>
        </div>
      );
    }
    if (type === 'string' || type === 'number' || type === 'boolean') {
      return (
        <div className={s.valueInputContainer}>
          <LabeledInput
            label="Value"
            type={type === 'number' ? 'number' : type === 'boolean' ? 'checkbox' : 'text'}
            value={String(fieldValue)}
            checked={type === 'boolean' ? fieldValue : undefined}
            onChange={handleValueChange}
          />
          <button 
            type="button" 
            onClick={() => onUpdate(currentPath, {})} 
            className={`${s.actionButton} ${s.convertToObjectButton}`}
            title="Convert to Object"
          >
            +&#123;&#125;
          </button>
        </div>
      );
    }
    return <span className={s.fieldTypeLabel}>({Array.isArray(fieldValue) ? 'array' : 'object'})</span>;
  };

  const renderNestedFields = () => {
    if (typeof fieldValue !== 'object' || fieldValue === null) {
      return null;
    }

    const entries = Array.isArray(fieldValue)
      ? fieldValue.map((v, i) => [i, v])
      : Object.entries(fieldValue);

    return (
      <div className={s.nestedObject}>
        {entries.map(([key, value]) => (
          <JsonField
            key={key}
            fieldKey={key}
            fieldValue={value}
            path={currentPath}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onKeyChange={onKeyChange}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            const newPath = Array.isArray(fieldValue)
              ? [...currentPath, fieldValue.length]
              : [...currentPath, `newField${Object.keys(fieldValue).length}`];
            onUpdate(newPath, ''); // Add empty string as default value
          }}
          className={s.addFieldButton}
        >
          <FontAwesomeIcon icon={faPlus} /> Add {Array.isArray(fieldValue) ? 'Item' : 'Field'}
        </button>
      </div>
    );
  };

  return (
    <div className={s.fieldItem}>
      <div className={s.fieldControls}>
        {isArrayItem ? (
          <span className={s.arrayIndex}>{fieldKey}</span>
        ) : (
          <LabeledInput
            label={`Field (${Array.isArray(fieldValue) ? 'array' : typeof fieldValue})`}
            type="text"
            value={String(fieldKey)}
            onChange={handleKeyChange}
          />
        )}
        {renderValueInput()}
        <button type="button" onClick={() => onDelete(currentPath)} className={s.removeFieldButton}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </div>
      {renderNestedFields()}
    </div>
  );
};

export const FormInputMode: React.FC<FormInputModeProps> = ({ jsonData, onJsonDataChange }) => {
  const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

  const updateJson = (path: (string | number)[], value: any) => {
    const newJsonData = deepClone(jsonData);
    let current: any = newJsonData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onJsonDataChange(newJsonData);
  };

  const deleteFromJson = (path: (string | number)[]) => {
    const newJsonData = deepClone(jsonData);
    let parent: any = newJsonData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent[path[i]];
    }
    const finalKey = path[path.length - 1];
    if (Array.isArray(parent)) {
      parent.splice(Number(finalKey), 1);
    } else {
      delete parent[finalKey];
    }
    onJsonDataChange(newJsonData);
  };

  const changeKeyInJson = (path: (string | number)[], newKey: string) => {
    const oldKey = path[path.length - 1];
    if (oldKey === newKey) return;

    const newJsonData = deepClone(jsonData);
    let parent: any = newJsonData;
    for (let i = 0; i < path.length - 1; i++) {
      parent = parent[path[i]];
    }

    if (typeof oldKey === 'number' || Array.isArray(parent)) {
      console.error("Cannot change key of an array item.");
      return;
    }
    
    const value = parent[oldKey];
    delete parent[oldKey];
    parent[newKey] = value;
    
    onJsonDataChange(newJsonData);
  };

  return (
    <div className={s.fieldsSection}>
      <h4>Fields</h4>
      {Object.entries(jsonData).map(([key, value]) => (
        <JsonField
          key={key}
          fieldKey={key}
          fieldValue={value}
          path={[]}
          onUpdate={updateJson}
          onDelete={deleteFromJson}
          onKeyChange={changeKeyInJson}
        />
      ))}
      <button
        type="button"
        onClick={() => {
          const newKey = `newField${Object.keys(jsonData).length}`;
          const newJsonData = { ...jsonData, [newKey]: '' };
          onJsonDataChange(newJsonData);
        }}
        className={s.addFieldButton}
      >
        <FontAwesomeIcon icon={faPlus} /> Add Field
      </button>
    </div>
  );
};
