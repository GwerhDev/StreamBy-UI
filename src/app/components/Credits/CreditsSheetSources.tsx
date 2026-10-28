import s from './CreditsSheet.module.css';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowDown, faFile, faFolder, faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { CreditsSheet, CreditsSheetSources as Sources, StorageFile } from '../../../interfaces';
import { conflictOf, saveDocument } from '../../../services/documents';
import { getStorageFolders } from '../../../services/storage';
import { AssetPickerModal } from '../Modals/AssetPickerModal';

interface CreditsSheetSourcesProps {
  projectId: string;
  sheet: CreditsSheet;
  editable: boolean;
  // After its sources are saved (or found changed by someone else): to read it again.
  onSaved: () => void;
}

// What feeds a credits sheet: the assets and Storage folders picked on it (editable), and the
// assets the Ingest nodes connected to its node import (shown, set on the workflow).
export function CreditsSheetSources({ projectId, sheet, editable, onSaved }: CreditsSheetSourcesProps) {
  const dispatch = useDispatch<AppDispatch>();
  const connections = useSelector((state: RootState) => state.currentProject.data?.storageConnections);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  // The folders to pick from: the top ones of each storage connection (with what's inside them).
  useEffect(() => {
    let cancelled = false;
    Promise.all((connections ?? []).map(async conn => {
      try {
        return (await getStorageFolders(projectId, conn.id, null)).map(f => ({ id: f.id, name: (connections ?? []).length > 1 ? `${conn.name} / ${f.name}` : f.name }));
      } catch {
        return [];
      }
    })).then(found => { if (!cancelled) setFolders(found.flat()); });
    return () => { cancelled = true; };
  }, [projectId, connections]);

  const save = async (sources: Sources) => {
    setSaving(true);
    try {
      await saveDocument(projectId, sheet.document.id, sheet.document.version, { content: JSON.stringify(sources) });
    } catch (err) {
      dispatch(addApiResponse({
        message: conflictOf(err) ? 'Someone changed its sources meanwhile: here they are now.' : err instanceof Error ? err.message : 'Failed to save its sources.',
        type: 'error',
      }));
    } finally {
      setSaving(false);
      onSaved();
    }
  };

  const { assetIds, folderIds } = sheet.sources;
  const nameOf = new Map(sheet.rows.map(r => [r.assetId, r.name]));
  const ingested = sheet.rows.filter(r => r.from.includes('ingest'));
  const folderName = (id: string) => folders.find(f => f.id === id)?.name ?? 'Folder';
  const free = folders.filter(f => !folderIds.includes(f.id));

  const addAssets = (files: StorageFile[]) => {
    setPicking(false);
    const added = files.map(f => f.id).filter(id => !assetIds.includes(id));
    if (added.length) save({ assetIds: [...assetIds, ...added], folderIds });
  };

  const chip = (key: string, icon: typeof faFile, label: string, onRemove?: () => void) => (
    <li key={key} className={s.chip} data-testid={`source-${key}`}>
      <FontAwesomeIcon icon={icon} />
      <span className={s.chipLabel}>{label}</span>
      {onRemove && (
        <button type="button" className={s.chipRemove} aria-label={`Remove ${label}`} onClick={onRemove} disabled={saving}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </li>
  );

  return (
    <div className={s.sources} data-testid="credits-sheet-sources">
      <ul className={s.chips}>
        {assetIds.map(id => chip(`asset-${id}`, faFile, nameOf.get(id) ?? 'Deleted asset',
          editable ? () => save({ assetIds: assetIds.filter(a => a !== id), folderIds }) : undefined))}
        {folderIds.map(id => chip(`folder-${id}`, faFolder, folderName(id),
          editable ? () => save({ assetIds, folderIds: folderIds.filter(f => f !== id) }) : undefined))}
        {ingested.map(r => chip(`ingest-${r.assetId}`, faCloudArrowDown, `${r.name} (Ingest)`))}
        {!assetIds.length && !folderIds.length && !ingested.length && <li className={s.muted}>Nothing feeds it yet.</li>}
      </ul>
      {editable && (
        <div className={s.sourceActions}>
          <button type="button" className={s.sourceButton} data-testid="credits-sheet-add-assets" onClick={() => setPicking(true)} disabled={saving}>
            <FontAwesomeIcon icon={faPlus} /> Assets
          </button>
          {free.length > 0 && (
            <select
              className={s.sourceSelect} data-testid="credits-sheet-add-folder" value="" disabled={saving} aria-label="Add a folder"
              onChange={e => { if (e.target.value) save({ assetIds, folderIds: [...folderIds, e.target.value] }); }}
            >
              <option value="">+ Folder</option>
              {free.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </div>
      )}
      {picking && <AssetPickerModal projectId={projectId} onInsert={addAssets} onClose={() => setPicking(false)} />}
    </div>
  );
}
