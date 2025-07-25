import { useSelector } from "react-redux";
import { useState } from "react";
import { RootState } from "../../../store";
import { createExport } from "../../../services/exports";
import { Export } from '../../../interfaces';

export function CreateExportForm() {
  const { data: currentProject } = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<Export | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <h2>Create new Export</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label>Collection's name *</label>
          <input
            type="text"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear Export"}
        </button>
      </form>

      {created && (
        <div>
          <h4>Export creado:</h4>
          <pre>{JSON.stringify(created, null, 2)}</pre>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
