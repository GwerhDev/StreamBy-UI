import s from './FileDetailPanel.module.css';
import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCopy, faCheck, faDownload, faTrash,
  faHeadphones, faVideo, faCubes, faImage, faArrowsRotate, faPencil,
  faFileLines, faDatabase, faBolt, faShield, faTriangleExclamation, faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { StorageFile, StorageCategory, AssetRights, LicenseMetadata } from '../../../interfaces';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { LicenseFields } from './LicenseFields';
import { EMPTY_LICENSE, licenseError } from '../../../utils/licenses';
import { AssetJobs } from '../Jobs/AssetJobs';
import { getAssetMetadata, getAssetRights, putAssetRights } from '../../../services/storage';

interface FileDetailPanelProps {
  file: StorageFile;
  category: StorageCategory;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, file: File) => Promise<void>;
  onRename?: (id: string, displayName: string) => Promise<void>;
}

type TabId = 'info' | 'metadata' | 'jobs' | 'rights';

const acceptTypes: Record<StorageCategory, string> = {
  images: 'image/*',
  audios: 'audio/*',
  videos: 'video/*',
  '3d-models': '.glb,.gltf,.obj,.fbx,.stl,.ply',
};

const categoryIcon = {
  images: faImage,
  audios: faHeadphones,
  videos: faVideo,
  '3d-models': faCubes,
};

function formatBytes(bytes: number): string {
  if (!bytes || isNaN(bytes) || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function MetadataTab({ file, projectId }: { file: StorageFile; projectId: string }) {
  // Its custom tags (set from the API or by an agent), shown under its own fields.
  const [customTags, setCustomTags] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let cancelled = false;
    setCustomTags(null);
    getAssetMetadata(projectId, file.id)
      .then(meta => { if (!cancelled) setCustomTags(meta?.customTags ?? {}); })
      .catch(() => { if (!cancelled) setCustomTags({}); });
    return () => { cancelled = true; };
  }, [projectId, file.id]);

  const fields: { label: string; value: string }[] = [
    { label: 'Content type', value: file.contentType || '—' },
    { label: 'Size', value: formatBytes(file.size) },
    { label: 'Category', value: file.category },
    { label: 'Storage key', value: file.storageKey || file.key || '—' },
    { label: 'Uploaded by', value: file.uploadedBy || '—' },
    { label: 'Created', value: file.createdAt ? new Date(file.createdAt).toLocaleString() : '—' },
    { label: 'Modified', value: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—' },
  ];

  return (
    <div className={s.tabContent}>
      {fields.map(f => (
        <div key={f.label} className={s.field}>
          <p className={s.fieldLabel}>{f.label}</p>
          <p className={s.fieldValue}>{f.value}</p>
        </div>
      ))}
      {customTags && Object.keys(customTags).length > 0 && (
        <div className={s.customTags} data-testid="custom-tags">
          <p className={s.sectionLabel}>Custom tags</p>
          {Object.entries(customTags).map(([key, value]) => (
            <div key={key} className={s.field}>
              <p className={s.fieldLabel}>{key}</p>
              <p className={s.fieldValue}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CREDIT_FIELDS: { key: keyof LicenseMetadata; label: string }[] = [
  { key: 'creatorName', label: 'creator' }, { key: 'sourceUrl', label: 'source link' }, { key: 'licenseType', label: 'license' },
];

const metadataOf = (rights: AssetRights | null): LicenseMetadata => ({
  sourceUrl: rights?.sourceUrl ?? null, creatorName: rights?.creatorName ?? null, creatorUrl: rights?.creatorUrl ?? null,
  licenseType: rights?.licenseType ?? null, comments: rights?.comments ?? null,
});

function RightsTab({ fileId, projectId }: { fileId: string; projectId: string }) {
  const [rights, setRights]     = useState<AssetRights | null>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState<LicenseMetadata>(EMPTY_LICENSE);
  const [error, setError]       = useState<string | null>(null);
  // A change made elsewhere (a credits sheet, an agent) shows here at once.
  const lastEvent = useSelector((state: RootState) => state.creditsSheets.lastEvent);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAssetRights(projectId, fileId)
      .then(r => { if (!cancelled) { setRights(r); setForm(metadataOf(r)); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fileId, projectId]);

  useEffect(() => {
    if (!lastEvent || lastEvent.projectId !== projectId || lastEvent.action !== 'saved' || !lastEvent.assetIds.includes(fileId) || !lastEvent.rights) return;
    setRights(lastEvent.rights);
    if (!editing) setForm(metadataOf(lastEvent.rights));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  const handleSave = async () => {
    const invalid = licenseError(form);
    if (invalid) { setError(invalid); return; }
    setSaving(true);
    setError(null);
    try {
      // Every field, so one emptied is cleared.
      const saved = await putAssetRights(projectId, fileId, Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v ?? ''])));
      setRights(saved);
      setForm(metadataOf(saved));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the license metadata.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={s.tabEmpty}>
        <FontAwesomeIcon icon={faSpinner} spin className={s.tabEmptyIcon} />
      </div>
    );
  }

  if (!editing) {
    const missing = CREDIT_FIELDS.filter(f => !rights?.[f.key]).map(f => f.label);
    const field = (label: string, value?: string | null) =>
      value ? <div className={s.field}><p className={s.fieldLabel}>{label}</p><p className={s.fieldValue}>{value}</p></div> : null;
    return (
      <div className={s.tabContent}>
        {missing.length > 0 && (
          <div className={s.rightsAlert} data-testid="rights-missing">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            Missing its {missing.join(', ')}: its credits are incomplete
          </div>
        )}
        {rights ? (
          <>
            {field('Source link', rights.sourceUrl)}
            {field('Creator', rights.creatorName)}
            {field('Creator link', rights.creatorUrl)}
            {field('License', rights.licenseType)}
            {field('Comments', rights.comments)}
          </>
        ) : (
          <p className={s.rightsEmpty}>No license metadata recorded.</p>
        )}
        <button className={s.rightsEditBtn} type="button" data-testid="rights-edit" onClick={() => { setError(null); setEditing(true); }}>
          Edit license
        </button>
      </div>
    );
  }

  return (
    <div className={s.tabContent}>
      {error && (
        <div className={s.rightsAlert} data-testid="rights-error">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {error}
        </div>
      )}
      <div className={s.rightsForm}>
        <LicenseFields values={form} onChange={setForm} disabled={saving} idPrefix="rights" />
      </div>
      <div className={s.rightsActions}>
        <button className={s.rightsEditBtn} type="button" data-testid="rights-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className={s.rightsCancelBtn} type="button" onClick={() => { setEditing(false); setError(null); setForm(metadataOf(rights)); }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function FileDetailPanel({ file, category, onClose, onDelete, onUpdate, onRename }: FileDetailPanelProps) {
  const { id: projectId = '' } = useParams<{ id: string }>();
  const [activeTab, setActiveTab]     = useState<TabId>('info');
  const [copied, setCopied]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [updating, setUpdating]       = useState(false);
  const [renaming, setRenaming]       = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConfirmDelete(false);
    setRenaming(false);
    setActiveTab('info');
  }, [file.id]);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const cleanUrl = (url: string) => url.split('?')[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cleanUrl(file.url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    e.target.value = '';
    setUpdating(true);
    try {
      await onUpdate(file.id, picked);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(file.id);
      onClose();
    } else {
      setConfirmDelete(true);
    }
  };

  const startRename = () => {
    setRenameValue(file.displayName);
    setRenaming(true);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.displayName || !onRename) {
      setRenaming(false);
      return;
    }
    setRenameLoading(true);
    try {
      await onRename(file.id, trimmed);
    } finally {
      setRenameLoading(false);
      setRenaming(false);
    }
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setRenaming(false);
  };

  const rightsExpiring = activeTab !== 'rights'; // evaluated lazily — badge shown on tab button

  const TABS: { id: TabId; icon: typeof faFileLines; label: string; badge?: boolean }[] = [
    { id: 'info',     icon: faFileLines, label: 'Info' },
    { id: 'metadata', icon: faDatabase,  label: 'Metadata' },
    { id: 'jobs',     icon: faBolt,      label: 'Jobs' },
    { id: 'rights',   icon: faShield,    label: 'Rights', badge: rightsExpiring },
  ];

  return (
    <div className={s.panel}>
      <div className={s.header}>
        <span className={s.headerTitle}>File details</span>
        <button className={s.closeBtn} onClick={onClose} title="Close">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div className={s.preview}>
        {category === 'images' ? (
          <img src={file.url} alt={file.displayName} className={s.previewImage} />
        ) : (
          <div className={s.previewIcon}>
            <FontAwesomeIcon icon={categoryIcon[category]} className={s.fileIcon} />
          </div>
        )}
      </div>

      <div className={s.info}>
        {renaming ? (
          <div className={s.renameRow}>
            <input
              ref={renameInputRef}
              className={s.renameInput}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={handleRenameKey}
              disabled={renameLoading}
            />
          </div>
        ) : (
          <div className={s.fileNameRow}>
            <p className={s.fileName} title={file.displayName}>{file.displayName}</p>
            {onRename && (
              <button className={s.renameBtn} onClick={startRename} title="Rename">
                <FontAwesomeIcon icon={faPencil} />
              </button>
            )}
          </div>
        )}

        <div className={s.urlRow}>
          <p className={s.urlText} title={cleanUrl(file.url)}>{cleanUrl(file.url)}</p>
          <button className={s.copyBtn} onClick={handleCopy} title="Copy URL">
            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className={s.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`${s.tabBtn} ${activeTab === t.id ? s.tabBtnActive : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <FontAwesomeIcon icon={t.icon} className={s.tabIcon} />
              {t.label}
            </button>
          ))}
        </div>

        <div className={s.tabBody}>
          {activeTab === 'info' && (
            <div className={s.tabContent}>
              <div className={s.field}>
                <p className={s.fieldLabel}>Size</p>
                <p className={s.fieldValue}>{formatBytes(file.size)}</p>
              </div>
              <div className={s.field}>
                <p className={s.fieldLabel}>Type</p>
                <p className={s.fieldValue}>{file.contentType || '—'}</p>
              </div>
              {file.lastModified && (
                <div className={s.field}>
                  <p className={s.fieldLabel}>Modified</p>
                  <p className={s.fieldValue}>{new Date(file.lastModified).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'metadata' && <MetadataTab file={file} projectId={projectId} />}
          {activeTab === 'jobs' && <AssetJobs projectId={projectId} assetId={file.id} category={category} />}
          {activeTab === 'rights' && <RightsTab fileId={file.id} projectId={projectId} />}
        </div>
      </div>

      <div className={s.actions}>
        <input
          ref={replaceInputRef}
          type="file"
          accept={acceptTypes[category]}
          className={s.hiddenInput}
          onChange={handleReplace}
        />
        <a href={file.url} download={file.displayName} className={s.actionBtn}>
          <FontAwesomeIcon icon={faDownload} />
          Download
        </a>
        <button
          className={s.actionBtn}
          onClick={() => replaceInputRef.current?.click()}
          disabled={updating}
        >
          <FontAwesomeIcon icon={faArrowsRotate} />
          {updating ? 'Replacing…' : 'Replace'}
        </button>
        <button
          className={`${s.actionBtn} ${confirmDelete ? s.actionBtnConfirm : s.actionBtnDanger}`}
          onClick={handleDelete}
          disabled={updating}
        >
          <FontAwesomeIcon icon={faTrash} />
          {confirmDelete ? 'Confirm?' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
