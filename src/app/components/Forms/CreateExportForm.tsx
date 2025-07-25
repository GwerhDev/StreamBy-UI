import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";
import { Export, FieldDefinition } from '../../../interfaces';
import s from './CreateExportForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark, faPlus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LabeledSelect } from '../Selects/LabeledSelect';

export function CreateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const navigate = useNavigate();

  const fieldTypes = [
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date" },
  ];

  const handleAddField = () => {
    setFields([...fields, { name: "", type: "string", label: "", required: false }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const handleFieldChange = (index: number, fieldName: keyof FieldDefinition, value: string | boolean) => {
    const newFields = [...fields];
    (newFields[index] as any)[fieldName] = value;
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !collectionName || fields.length === 0) {
      setError("Faltan campos obligatorios o no se han definido campos.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createExport(currentProject?.id || '', {
        name,
        description,
        collectionName,
        fields,
      });
      setCreated(response);
      setName("");
      setDescription("");
      setCollectionName("");
      setFields([]);
    } catch (err: unknown) {
      setError((err as Error).message || "Error al crear export");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to the previous page
  };

  useEffect(() => {
    setDisabled(!name || !collectionName || fields.length === 0 || loading);
  }, [name, collectionName, fields, loading]);

  return (
    <div className={s.container}>
      <Spinner isLoading={loading} />
      <form onSubmit={handleSubmit}>
        <h3>New Export</h3>
        <p>Fill the form to create a new export</p>

        <LabeledInput
          label="Export's name"
          type="text"
          placeholder=""
          id="name-input"
          name="name-input"
          htmlFor="name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <LabeledInput
          label="Collection's name"
          type="text"
          placeholder=""
          id="collection-name-input"
          name="collection-name-input"
          htmlFor="collection-name-input"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        />

        <LabeledInput
          label="Description (optional)"
          type="text"
          placeholder=""
          id="description-input"
          name="description-input"
          htmlFor="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={s.fieldsSection}>
          <h4>Fields</h4>
          {fields.map((field, index) => (
            <div key={index} className={s.fieldItem}>
              <LabeledInput
                label="Field Name"
                type="text"
                placeholder=""
                value={field.name}
                onChange={(e) => handleFieldChange(index, "name", e.target.value)}
              />
              <LabeledSelect
                label="Field Type"
                value={field.type}
                options={fieldTypes}
                onChange={(e) => handleFieldChange(index, "type", e.target.value)}
              />
              <LabeledInput
                label="Field Label"
                type="text"
                placeholder=""
                value={field.label}
                onChange={(e) => handleFieldChange(index, "label", e.target.value)}
              />
              <div className={s.checkboxContainer}>
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={field.required}
                  onChange={(e) => handleFieldChange(index, "required", e.target.checked)}
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

        <span className={s.buttonContainer}>
          <ActionButton disabled={disabled || loading} icon={faFileExport} text="Create" type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={handleCancel} text="Cancel" />
        </span>

        {created && (
          <div>
            <h4>Export creado:</h4>
            <pre>{JSON.stringify(created, null, 2)}</pre>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
