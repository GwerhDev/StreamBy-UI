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
  const [jsonInput, setJsonInput] = useState<string>("[]");
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form'); // 'form' or 'json'
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

    let fieldsToSend: FieldDefinition[] = [];

    if (inputMode === 'json') {
      try {
        fieldsToSend = JSON.parse(jsonInput);
        if (!Array.isArray(fieldsToSend)) {
          setError("JSON input must be an array of field definitions.");
          return;
        }
        // Basic validation for each field in the parsed JSON
        for (const field of fieldsToSend) {
          if (!field.name || !field.type || !field.label) {
            setError("Each field in JSON must have 'name', 'type', and 'label'.");
            return;
          }
        }
      } catch (err) {
        setError("Invalid JSON format for fields.");
        return;
      }
    } else {
      fieldsToSend = fields;
    }

    if (!name || !collectionName || fieldsToSend.length === 0) {
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
        fields: fieldsToSend,
      });
      setCreated(response);
      setName("");
      setDescription("");
      setCollectionName("");
      setFields([]);
      setJsonInput("[]");
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
    const isFieldsDefined = inputMode === 'json' ? jsonInput !== "[]" && jsonInput.trim() !== "" : fields.length > 0;
    setDisabled(!name || !collectionName || !isFieldsDefined || loading);
  }, [name, collectionName, fields, jsonInput, inputMode, loading]);

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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        />

        <LabeledInput
          label="Collection's name"
          type="text"
          placeholder=""
          id="collection-name-input"
          name="collection-name-input"
          htmlFor="collection-name-input"
          value={collectionName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCollectionName(e.target.value)}
        />

        <LabeledInput
          label="Description (optional)"
          type="text"
          placeholder=""
          id="description-input"
          name="description-input"
          htmlFor="description-input"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
        />

        <div className={s.inputModeToggle}>
          <button
            type="button"
            className={`${s.toggleButton} ${inputMode === 'form' ? s.active : ''}`}
            onClick={() => setInputMode('form')}
          >
            Form Input
          </button>
          <button
            type="button"
            className={`${s.toggleButton} ${inputMode === 'json' ? s.active : ''}`}
            onClick={() => setInputMode('json')}
          >
            JSON Input
          </button>
        </div>

        {inputMode === 'form' ? (
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
        ) : (
          <div className={s.fieldsSection}>
            <h4>JSON Input for Fields</h4>
            <textarea
              className={s.jsonInputTextarea}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Enter JSON array of field definitions here..."
              rows={10}
            ></textarea>
          </div>
        )}

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
