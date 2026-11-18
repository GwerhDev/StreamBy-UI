import s from './PipelineRuns.module.css';
import { PipelineTrigger, PipelineUploadFilter, StorageCategory } from '../../../interfaces';
import { TRIGGER_OPTIONS, UPLOAD_CATEGORY_OPTIONS } from './pipelineSteps';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { FolderPath } from './useStorageFolderPaths';

interface Props {
  triggers: PipelineTrigger[];
  disabled?: boolean;
  onToggle: (trigger: PipelineTrigger, on: boolean) => void;
  // What a new version uploaded starts a run on, and the folders it may be limited to (null: still read).
  uploadFilter: PipelineUploadFilter;
  folders: FolderPath[] | null;
  onFilterChange: (filter: PipelineUploadFilter) => void;
}

const toggled = <T,>(list: T[], value: T, on: boolean) => (on ? [...list.filter(v => v !== value), value] : list.filter(v => v !== value));

// What starts a card's run of a pipeline by itself (a run can always be started by hand).
export function PipelineTriggers({ triggers, disabled, onToggle, uploadFilter, folders, onFilterChange }: Props) {
  const onUpload = triggers.includes('version_uploaded');
  return (
    <fieldset className={s.triggers} disabled={disabled}>
      <legend className={s.legend}>Start a card's run when</legend>
      {TRIGGER_OPTIONS.map(t => (
        <CustomCheckbox
          key={t.value} id={`trigger-${t.value}`} name="pipeline-trigger" value={t.value} label={t.label}
          checked={triggers.includes(t.value)} onChange={e => onToggle(t.value, e.target.checked)}
        />
      ))}
      {onUpload && (
        <div className={s.uploadFilter} data-testid="upload-filter">
          <span className={s.filterLabel}>Only assets of</span>
          <div className={s.filterOptions}>
            {UPLOAD_CATEGORY_OPTIONS.map(c => (
              <CustomCheckbox
                key={c.value} id={`upload-category-${c.value}`} name="upload-category" value={c.value} label={c.label}
                checked={uploadFilter.categories.includes(c.value)}
                onChange={e => onFilterChange({ ...uploadFilter, categories: toggled<StorageCategory>(uploadFilter.categories, c.value, e.target.checked) })}
              />
            ))}
          </div>
          <span className={s.filterLabel}>Only in the folders (or inside them)</span>
          {folders === null ? <p className={s.hint}>Reading the folders…</p> : folders.length === 0 ? (
            <p className={s.hint}>The project's Storage has no folders.</p>
          ) : (
            <div className={s.filterOptions}>
              {folders.map(f => (
                <CustomCheckbox
                  key={f.id} id={`upload-folder-${f.id}`} name="upload-folder" value={f.id} label={f.path}
                  checked={uploadFilter.folderIds.includes(f.id)}
                  onChange={e => onFilterChange({ ...uploadFilter, folderIds: toggled(uploadFilter.folderIds, f.id, e.target.checked) })}
                />
              ))}
            </div>
          )}
          <p className={s.hint}>With none chosen, any. A version uploaded from Storage or by an agent starts it.</p>
        </div>
      )}
      <p className={s.hint}>With none, runs start only by hand, from a card.</p>
    </fieldset>
  );
}
