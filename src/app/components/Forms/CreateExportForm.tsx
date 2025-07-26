import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { RootState } from "../../../store";
import { createExport, createRawExport } from "../../../services/exports";
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
import JSONEditor, { JSONEditorOptions, JSONEditorMode } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.min.css';

export function CreateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [rawJsonData, setRawJsonData] = useState<any>({}); // For raw JSON data (object)
  const [inputMode, setInputMode] = useState<'form' | 'rawJson'>('form'); // 'form' or 'rawJson'
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const navigate = useNavigate();

  const editorRef = useRef<HTMLDivElement>(null);
  const jsonEditor = useRef<JSONEditor | null>(null);

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

    if (!name || !collectionName) {
      setError("Faltan campos obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let payload: any = {
        name,
        description,
        collectionName,
      };

      if (inputMode === 'rawJson') {
        // rawJsonData is already an object due to onChange handler
        payload.jsonData = rawJsonData;
        const response = await createRawExport(currentProject?.id || '', payload);
        setCreated(response);
        setRawJsonData({}); // Reset to empty object
        if (jsonEditor.current) {
          jsonEditor.current.set({}); // Clear editor content
        }
      } else { // form mode
        if (fields.length === 0) {
          setError("No se han definido campos.");
          setLoading(false);
          return;
        }
        payload.fields = fields;
        const response = await createExport(currentProject?.id || '', payload);
        setCreated(response);
        setFields([]);
      }

      setName("");
      setDescription("");
      setCollectionName("");

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
    if (editorRef.current) {
      const options: JSONEditorOptions = {
        mode: 'code' as JSONEditorMode, // or 'tree', 'view'
        onChange: () => {
          try {
            const editorContent = jsonEditor.current?.get();
            setRawJsonData(editorContent);
          } catch (e) {
            console.error('JSONEditor get() error:', e);
            setRawJsonData({});
          }
        },
        onError: (err: any) => {
          console.error('JSONEditor error:', err);
          setError(err.message);
        },
      };
      jsonEditor.current = new JSONEditor(editorRef.current, options, rawJsonData);
    }

    return () => {
      if (jsonEditor.current) {
        jsonEditor.current.destroy();
      }
    };
  }, [inputMode]); // Re-initialize editor when inputMode changes

  useEffect(() => {
    let isContentDefined = false;
    if (inputMode === 'rawJson') {
      // rawJsonData is already an object
      if (rawJsonData === null) {
        isContentDefined = false; // Explicitly handle null as not defined
      } else if (typeof rawJsonData === 'object') {
        if (Array.isArray(rawJsonData)) {
          isContentDefined = rawJsonData.length > 0;
        } else {
          isContentDefined = Object.keys(rawJsonData).length > 0;
        }
      } else if (typeof rawJsonData === 'string') {
        isContentDefined = rawJsonData.trim().length > 0; // Non-empty string
      } else if (typeof rawJsonData === 'number' || typeof rawJsonData === 'boolean') {
        isContentDefined = true; // Numbers and booleans are always defined if parsed successfully
      } else {
        isContentDefined = false; // Other unexpected types
      }
    } else { // form mode
      isContentDefined = fields.length > 0;
    }
    setDisabled(!name || !collectionName || !isContentDefined || loading);
  }, [name, collectionName, fields, rawJsonData, inputMode, loading]);

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
            className={`${s.toggleButton} ${inputMode === 'rawJson' ? s.active : ''}`}
            onClick={() => setInputMode('rawJson')}
          >
            Raw JSON
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
            <h4>Raw JSON Data</h4>
            <div id="jsoneditor" ref={editorRef} style={{ height: '300px', width: '100%' }}></div>
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