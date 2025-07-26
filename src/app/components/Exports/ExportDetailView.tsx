import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { getExport } from '../../../services/exports';
import { ExportDetails as ExportDetailsInterface } from '../../../interfaces';

interface ExportDetailViewProps {
  exportId: string;
}

export const ExportDetailView: React.FC<ExportDetailViewProps> = ({ exportId }) => {
  const { id: projectId } = useSelector((state: RootState) => state.currentProject.data || {});
  const [exportDetails, setExportDetails] = useState<ExportDetailsInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (!projectId || !exportId) {
        setError('Project ID or Export ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getExport(projectId, exportId);
        if (data) {
          setExportDetails(data);
        } else {
          setError('Export not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch export details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [projectId, exportId]);

  if (loading) {
    return <div>Loading export details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!exportDetails) {
    return <div>Export details not available.</div>;
  }

  return (
    <div>
      <h2>Export Details</h2>
      <p><strong>Name:</strong> {exportDetails.name}</p>
      <p><strong>Collection Name:</strong> {exportDetails.collectionName}</p>
      <p><strong>Status:</strong> {exportDetails.status}</p>
      <p><strong>Created At:</strong> {new Date(exportDetails.createdAt).toLocaleString()}</p>
      <p><strong>Updated At:</strong> {new Date(exportDetails.updatedAt).toLocaleString()}</p>
      <p><strong>Export Type:</strong> {exportDetails.exportType}</p>
      <p><strong>Exported By:</strong> {exportDetails.exportedBy}</p>
      {exportDetails.exportedFileUrl && (
        <p><strong>File URL:</strong> <a href={exportDetails.exportedFileUrl} target="_blank" rel="noopener noreferrer">Download</a></p>
      )}
    </div>
  );
};