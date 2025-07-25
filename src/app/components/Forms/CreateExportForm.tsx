import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";
import { Export } from '../../../interfaces';
import s from './CreateExportForm.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { Spinner } from '../Spinner';
import { faFileExport, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export function CreateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !collectionName) {
      setError("Faltan campos obligatorios");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await createExport(currentProject?.id || '', {
        name,
        description,
        collectionName,
      });
      setCreated(response);
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
    setDisabled(!name || !collectionName || loading);
  }, [name, collectionName, loading]);

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