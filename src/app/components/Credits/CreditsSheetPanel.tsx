import s from './CreditsSheet.module.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { faTableList } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { fetchCreditsSheets } from '../../../store/creditsSheetsSlice';
import { ActionButton } from '../Buttons/ActionButton';
import { useDocumentsRole } from '../Documents/documentText';
import { CreditsSheetSources } from './CreditsSheetSources';
import { useCreditsSheet } from './useCreditsSheet';

// A Credits sheet node's panel in the workflow: its status, what feeds it, and its sheet.
export function CreditsSheetPanel({ projectId, documentId, editMode }: { projectId: string; documentId: string; editMode: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { canEdit } = useDocumentsRole();
  const { sheet, error, load } = useCreditsSheet(projectId, documentId);

  // The nodes show the status the list has: it's read again with the sheet.
  useEffect(() => {
    if (sheet) dispatch(fetchCreditsSheets(projectId));
  }, [dispatch, projectId, sheet]);

  if (error) return <div className={s.panel}><p className={s.muted}>{error}</p></div>;
  if (!sheet) return <div className={s.panel}><p className={s.muted}>Loading…</p></div>;
  const incomplete = sheet.rows.filter(r => r.missing.length).length;
  return (
    <div className={s.panel} data-testid="credits-sheet-panel">
      <span className={`${s.status} ${sheet.status === 'complete' ? s.statusComplete : s.statusIncomplete}`} data-testid="credits-sheet-status">
        {sheet.status === 'complete' ? 'Complete' : 'Incomplete'}
      </span>
      <p className={s.muted}>
        {sheet.rows.length ? `${sheet.rows.length} assets · ${incomplete} incomplete` : 'No assets yet.'}
      </p>
      <CreditsSheetSources projectId={projectId} sheet={sheet} editable={editMode && canEdit} onSaved={load} />
      <ActionButton icon={faTableList} text="Open sheet" onClick={() => navigate(`/project/${projectId}/dashboard/documents/${encodeURIComponent(documentId)}`)} />
    </div>
  );
}
