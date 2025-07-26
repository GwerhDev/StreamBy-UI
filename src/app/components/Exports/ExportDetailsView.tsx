import s from './ExportDetailsView.module.css';
import JsonViewer from '../JsonViewer/JsonViewer';
import CopyButton from '../Buttons/CopyButton';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import { getExport } from '../../../services/exports';
import { ExportDetails as ExportDetailsInterface } from '../../../interfaces';
import { Spinner } from '../Spinner';

export const ExportDetailsView: React.FC = () => {
  const { id, exportId } = useParams<{ id: string; exportId: string }>();
  const [exportDetails, setExportDetails] = useState<ExportDetailsInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExportDetails = async () => {
      if (!id || !exportId) {
        setError('Project ID or Export ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getExport(id, exportId);
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
  }, [id, exportId]);

  if (loading) {
    return (<div className={s.container}><Spinner isLoading /></div>);
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!exportDetails) {
    return <div>Export details not available.</div>;
  }

  const fullEndpoint = `${API_BASE}/streamby/${id}/public-export/${exportDetails.name}`;

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2>Export {exportDetails.method} /{exportDetails.name}</h2>
        <CopyButton textToCopy={`/streamby/${id}/public-export/${exportDetails.name}`}>
          Copy Endpoint
        </CopyButton>
      </div>
      <div className={s.detailsGrid}>
        <p><strong>Full endpoint:</strong><a target='_blank' href={fullEndpoint}> {`/streamby/${id}/public-export/${exportDetails.name}`}</a></p>
        <p><strong>Name:</strong> {exportDetails.name}</p>
        <p><strong>Collection Name:</strong> {exportDetails.collectionName}</p>
        <p><strong>Export Type:</strong> {exportDetails.type}</p>
        <p><strong>Created At:</strong> {new Date(exportDetails.createdAt).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(exportDetails.updatedAt).toLocaleString()}</p>
      </div>
      {exportDetails.type === 'raw' && exportDetails.json && (
        <div className={s.rawDataSection}>
          <h3>Raw Data:</h3>
          <div className={s.jsonViewer}>
            <JsonViewer data={exportDetails.json} />
          </div>
        </div>
      )}
    </div>
  );
};