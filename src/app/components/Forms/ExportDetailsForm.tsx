import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { getExport, updateExport } from "../../../services/exports";

export function ExportDetailsForm() {
  const { id: projectId, export_id: exportId } = useParams<{ id: string; export_id: string }>();
  const currentProject = useSelector((state: RootState) => state.currentProject);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [jsonData, setJsonData] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (projectId && exportId) {
        setLoading(true);
        try {
          const exportDetails = await getExport(projectId, exportId);
          setName(exportDetails.name);
          setDescription(exportDetails.description);
          setCollectionName(exportDetails.collectionName);
          if (exportDetails.data) {
            setJsonData(JSON.stringify(exportDetails.data, null, 2));
            setFormattedJson(JSON.stringify(exportDetails.data, null, 2));
          }
        } catch (err: any) {
          setError(err.message || "Error al cargar los detalles del export");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchExportDetails();
  }, [projectId, exportId]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonData(value);
    try {
      if (value.trim() === "") {
        setFormattedJson("");
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(value);
      setFormattedJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err) {
      setFormattedJson("");
      setJsonError("JSON inválido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !collectionName) {
      setError("Faltan campos obligatorios");
      return;
    }

    let parsedData = null;
    if (jsonData.trim() !== "") {
      try {
        parsedData = JSON.parse(jsonData);
      } catch (err) {
        setJsonError("JSON inválido. Por favor, corrige el formato.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setJsonError(null);
      await updateExport(currentProject.id, exportId, {
        name,
        description,
        collectionName,
        data: parsedData,
      });
      alert("Export actualizado exitosamente!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al actualizar export");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
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
        <div>
          <label>JSON Data</label>
          <textarea
            value={jsonData}
            onChange={handleJsonChange}
            rows={10}
            cols={50}
            placeholder="Ingresa tu JSON aquí"
          />
          {jsonError && <p style={{ color: "red" }}>{jsonError}</p>}
          {formattedJson && (
            <div>
              <h4>JSON Formateado:</h4>
              <pre>{formattedJson}</pre>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Export"}
        </button>
      </form>
    </div>
  );
}