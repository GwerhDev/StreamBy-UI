import s from './FormInputMode.module.css';
import React from 'react';
import { LabeledInput } from '../Inputs/LabeledInput';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';

// Props for the main component
interface FormInputModeProps {
  jsonData: any;
  onJsonDataChange: (newData: any) => void;
  jsonError: string | null;
}

// Props for the recursive field component
interface JsonFieldProps {
  fieldKey: string | number;
  fieldValue: any;
  path: (string | number)[];
  onUpdate: (path: (string | number)[], value: any) => void;
  onDelete: (path: (string | number)[]) => void;
  onKeyChange: (path: (string | number)[], newKey: string) => void;
  disabled: boolean;
}

const JsonField: React.FC<JsonFieldProps> = ({
  fieldKey,
  fieldValue,
  path,
  onUpdate,
  onDelete,
  onKeyChange,
  disabled,
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
      const checkboxId = `checkbox-${currentPath.join('-')}`;
      return (
        <CustomCheckbox
          id={checkboxId}
          name={checkboxId}
          checked={fieldValue}
          onChange={handleValueChange}
          label={String(fieldValue)}
        />
      );
    }
    if (type === 'string' || type === 'number') {
      const inputId = `value-input-${currentPath.join('-')}`;
      return (
        <div className={s.valueInputContainer}>
          <LabeledInput
            label="Value"
            type={type === 'number' ? 'number' : 'text'}
            id={inputId}
            name={inputId}
            htmlFor={inputId}
            placeholder=""
            value={String(fieldValue)}
            onChange={handleValueChange}
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => onUpdate(currentPath, {})}
            className={`${s.actionButton} ${s.convertToObjectButton}`}
            title="Convert to Object"
            disabled={disabled}
          >
            <FontAwesomeIcon icon={faNetworkWired} />
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
            disabled={disabled}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            const newPath = Array.isArray(fieldValue)
              ? [...currentPath, fieldValue.length]
              : [...currentPath, ""];
            onUpdate(newPath, ''); // Add empty string as default value
          }}
          className={s.addFieldButton}
          disabled={disabled}
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
            id={`key-input-${currentPath.join('-')}`}
            name={`key-input-${currentPath.join('-')}`}
            htmlFor={`key-input-${currentPath.join('-')}`}
            placeholder=""
            value={String(fieldKey)}
            onChange={handleKeyChange}
            disabled={disabled}
          />
        )}
        {renderValueInput()}
        <button type="button" onClick={() => onDelete(currentPath)} className={s.removeFieldButton} disabled={disabled}>
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </div>
      {renderNestedFields()}
    </div>
  );
};

export const FormInputMode: React.FC<FormInputModeProps> = ({ jsonData, onJsonDataChange, jsonError }) => {
  const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

  const updateJson = (path: (string | number)[], value: any) => {
    if (jsonError) return; // Prevent updates if there's a JSON error
    const newJsonData = deepClone(jsonData);
    let current: any = newJsonData;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onJsonDataChange(newJsonData);
  };

  const deleteFromJson = (path: (string | number)[]) => {
    if (jsonError) return; // Prevent updates if there's a JSON error
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
    if (jsonError) return; // Prevent updates if there's a JSON error
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
      {jsonError && <p className={s.errorMessage}>Error: Invalid JSON format. Please switch to Raw JSON mode to fix it. ({jsonError})</p>}
      {Object.entries(jsonData).map(([key, value]) => (
        <JsonField
          key={key}
          fieldKey={key}
          fieldValue={value}
          path={[]}
          onUpdate={updateJson}
          onDelete={deleteFromJson}
          onKeyChange={changeKeyInJson}
          disabled={!!jsonError}
        />
      ))}
      <button
        type="button"
        onClick={() => {
          const newKey = "";
          const newJsonData = { ...jsonData, [newKey]: '' };
          onJsonDataChange(newJsonData);
        }}
        className={s.addFieldButton}
        disabled={!!jsonError}
      >
        <FontAwesomeIcon icon={faPlus} /> Add Field
      </button>
    </div>
  );
};