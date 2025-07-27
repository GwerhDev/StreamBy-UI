import s from './FormInputMode.module.css';
import React from 'react';
import { FieldDefinition } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Selects/LabeledSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';

interface FormInputModeProps {
  fields: FieldDefinition[];
  fieldTypes: { value: string; label: string }[];
  handleAddField: () => void;
  handleRemoveField: (index: number) => void;
  handleFieldChange: (index: number, fieldName: keyof FieldDefinition, value: string | boolean) => void;
}

export const FormInputMode: React.FC<FormInputModeProps> = ({
  fields,
  fieldTypes,
  handleAddField,
  handleRemoveField,
  handleFieldChange,
}) => {
  return (
    <div className={s.fieldsSection}>
      <h4>Fields</h4>
      {fields.map((field, index) => (
        <div key={index} className={s.fieldItem}>
          <LabeledInput
            label="Field Name"
            type="text"
            placeholder=""
            id={`field-name-${index}`}
            name={`field-name-${index}`}
            htmlFor={`field-name-${index}`}
            value={field.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(index, "name", e.target.value)}
          />
          <LabeledSelect
            label="Field Type"
            id={`field-type-${index}`}
            name={`field-type-${index}`}
            htmlFor={`field-type-${index}`}
            value={field.type}
            options={fieldTypes}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange(index, "type", e.target.value)}
          />
          <LabeledInput
            label="Field Label"
            type="text"
            placeholder=""
            id={`field-label-${index}`}
            name={`field-label-${index}`}
            htmlFor={`field-label-${index}`}
            value={field.label}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(index, "label", e.target.value)}
          />
          <div className={s.checkboxContainer}>
            <input
              type="checkbox"
              id={`required-${index}`}
              checked={field.required}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(index, "required", e.target.checked)}
            />
            <label htmlFor={`required-${index}`}>Required</label>
          </div>
          <button type="button" onClick={() => handleRemoveField(index)} className={s.removeFieldButton}>
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAddField} className={s.addFieldButton}>
        <FontAwesomeIcon icon={faPlus} /> Add Field
      </button>
    </div>
  );
};