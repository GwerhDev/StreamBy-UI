import s from './CreditsSheet.module.css';
import d from '../Documents/Documents.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableList, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { CreditsSheetRow, LICENSE_TYPES, LicenseMetadata } from '../../../interfaces';
import { putAssetRights } from '../../../services/storage';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { licenseError } from '../../../utils/licenses';
import { useDocumentsRole } from '../Documents/documentText';
import { CreditsSheetSources } from './CreditsSheetSources';
import { useCreditsSheet } from './useCreditsSheet';

type Column = keyof LicenseMetadata;

const COLUMNS: { key: Column; label: string; placeholder: string }[] = [
  { key: 'sourceUrl', label: 'Link', placeholder: 'https://…' },
  { key: 'creatorName', label: 'Creator', placeholder: 'Who made it' },
  { key: 'creatorUrl', label: 'Creator link', placeholder: 'https://…' },
  { key: 'licenseType', label: 'License', placeholder: '' },
  { key: 'comments', label: 'Comments', placeholder: '' },
];

// A cell of the sheet: its asset's metadata, saved to the asset when it's left changed.
function Cell({ row, column, editable, onSave }: {
  row: CreditsSheetRow; column: Column; editable: boolean; onSave: (value: string) => Promise<boolean>;
}) {
  const current = row[column] ?? '';
  const [value, setValue] = useState(current);
  useEffect(() => { setValue(current); }, [current]);
  const missing = (row.missing as string[]).includes(column);
  const testId = `cell-${row.assetId}-${column}`;

  if (!editable) {
    return <td className={missing ? s.cellMissing : undefined} data-testid={testId}>{current || '—'}</td>;
  }
  const commit = async (next: string) => {
    if (next.trim() === current) return;
    if (!(await onSave(next.trim()))) setValue(current);
  };
  return (
    <td className={missing ? s.cellMissing : undefined}>
      {column === 'licenseType' ? (
        <select className={s.cellInput} data-testid={testId} aria-label={`License of ${row.name}`} value={value}
          onChange={e => { setValue(e.target.value); commit(e.target.value); }}>
          <option value="">—</option>
          {LICENSE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      ) : (
        <input
          className={s.cellInput} data-testid={testId} aria-label={`${column} of ${row.name}`} value={value}
          placeholder={COLUMNS.find(c => c.key === column)?.placeholder}
          onChange={e => setValue(e.target.value)}
          onBlur={() => commit(value)}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setValue(current);
          }}
        />
      )}
    </td>
  );
}

// A credits sheet as a table: a row per asset fed to it, with its license metadata as it is
// now. Editing a cell edits the asset's metadata, so every sheet with it shows the change.
export const CreditsSheetView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '', docId = '' } = useParams<{ id: string; docId: string }>();
  const { canEdit } = useDocumentsRole();
  const { sheet, error, load } = useCreditsSheet(projectId, docId);
  const listPath = `/project/${projectId}/dashboard/documents`;

  useEffect(() => {
    if (!error) return;
    dispatch(addApiResponse({ message: error, type: 'error' }));
    navigate(listPath);
  }, [dispatch, navigate, error, listPath]);

  const save = async (row: CreditsSheetRow, column: Column, value: string) => {
    const invalid = licenseError({ [column]: value });
    if (invalid) { dispatch(addApiResponse({ message: invalid, type: 'error' })); return false; }
    try {
      await putAssetRights(projectId, row.assetId, { [column]: value });
      load();
      return true;
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to save it.', type: 'error' }));
      return false;
    }
  };

  if (!sheet) {
    return (
      <div className={d.container}>
        <div className={`${d.headerSkeleton} ${skeleton.skeleton}`} />
        <div className={`${d.bodySkeleton} ${skeleton.skeleton}`} />
      </div>
    );
  }

  const incomplete = sheet.rows.filter(r => r.missing.length).length;
  return (
    <div className={d.container} data-testid="credits-sheet">
      <SectionHeader
        icon={faTableList}
        title={sheet.document.title}
        subtitle="The credits of the assets fed to it, as each asset's license metadata is now."
        badge={sheet.status === 'complete' ? 'Complete' : 'Incomplete'}
        action={<SecondaryButton icon={faXmark} text="Close" onClick={() => navigate(listPath)} />}
      />
      <CreditsSheetSources projectId={projectId} sheet={sheet} editable={canEdit} onSaved={load} />
      {sheet.status === 'incomplete' && (
        <div className={s.alert} data-testid="credits-sheet-incomplete">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {sheet.rows.length
            ? `${incomplete} of ${sheet.rows.length} without their creator, link or license.`
            : 'No assets yet: pick some, or connect Ingest nodes to its node.'}
        </div>
      )}
      {!sheet.rows.length ? (
        <div className={d.emptyState}><EmptyBackground /></div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Asset</th>
                {COLUMNS.map(c => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map(row => (
                <tr key={row.assetId} className={row.missing.length ? s.rowIncomplete : undefined} data-testid={`row-${row.assetId}`}>
                  <td className={s.assetName} title={row.name}>{row.name}</td>
                  {COLUMNS.map(c => <Cell key={c.key} row={row} column={c.key} editable={canEdit} onSave={value => save(row, c.key, value)} />)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
