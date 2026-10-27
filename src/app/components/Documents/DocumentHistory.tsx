import s from './Documents.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { faArrowLeft, faEye, faEyeSlash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { upsertDocument } from '../../../store/documentsSlice';
import { getDocument, getDocumentVersion, getDocumentVersions, publishDocument } from '../../../services/documents';
import { DocumentVersion, DocumentVersionSummary, ProjectDocument } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { MarkdownView } from './MarkdownView';
import { DiffView } from './DiffView';
import { authorLabel, dateLabel, useDocumentsRole } from './documentText';
import { useDocumentEvents } from './useDocumentEvents';
import { useDocumentList } from './useDocumentList';

// A document's versions: each one as it was, what changed from another, and which one its
// exports deliver.
export const DocumentHistory = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '', docId = '' } = useParams<{ id: string; docId: string }>();
  const { canEdit } = useDocumentsRole();
  const [doc, setDoc] = useState<ProjectDocument | null>(null);
  const [versions, setVersions] = useState<DocumentVersionSummary[] | null>(null);
  const [selected, setSelected] = useState<DocumentVersion | null>(null);
  // The version it's compared with (none: it's shown as it reads).
  const [compareWith, setCompareWith] = useState<DocumentVersion | null>(null);
  const [publishing, setPublishing] = useState(false);
  const viewPath = `/project/${projectId}/dashboard/documents/${docId}`;
  useDocumentList(projectId);

  const fail = useCallback((err: unknown, fallback: string) =>
    dispatch(addApiResponse({ message: err instanceof Error ? err.message : fallback, type: 'error' })), [dispatch]);

  const select = useCallback(async (version: number) => {
    try {
      setSelected(await getDocumentVersion(projectId, docId, version));
      setCompareWith(null);
    } catch (err) { fail(err, 'Failed to load the version.'); }
  }, [projectId, docId, fail]);

  // Only the latest load shows: an earlier one (another document's) may answer after it.
  const latest = useRef(0);
  const load = useCallback(async (keep?: number) => {
    const mine = ++latest.current;
    try {
      const [loaded, list] = await Promise.all([getDocument(projectId, docId), getDocumentVersions(projectId, docId)]);
      if (mine !== latest.current) return;
      setDoc(loaded);
      setVersions(list);
      // The current version is the document as loaded: no request for it.
      if (keep === undefined || keep === loaded.version) {
        setSelected({ documentId: loaded.id, projectId: loaded.projectId, version: loaded.version, title: loaded.title, content: loaded.content, author: loaded.updatedBy, createdAt: loaded.updatedAt });
        setCompareWith(null);
      } else {
        await select(keep);
      }
    } catch (err) {
      if (mine !== latest.current) return;
      fail(err, 'Failed to load the history.');
      navigate(viewPath);
    }
  }, [projectId, docId, select, fail, navigate, viewPath]);

  useEffect(() => { load(); }, [load]);

  useDocumentEvents(projectId, docId, event => {
    if (event.action === 'deleted') navigate(`/project/${projectId}/dashboard/documents`);
    else load(selected?.version);
  });

  const compare = async (value: string) => {
    if (!value) return setCompareWith(null);
    try { setCompareWith(await getDocumentVersion(projectId, docId, Number(value))); } catch (err) { fail(err, 'Failed to load the version.'); }
  };

  const publish = async (version: number | null) => {
    setPublishing(true);
    try {
      const updated = await publishDocument(projectId, docId, version);
      setDoc(updated);
      dispatch(upsertDocument(updated));
      dispatch(addApiResponse({ message: version === null ? 'Not published anymore.' : `Version ${version} published.`, type: 'success' }));
    } catch (err) {
      fail(err, 'Failed to publish it.');
    } finally {
      setPublishing(false);
    }
  };

  if (!doc || !versions) {
    return (
      <div className={s.container}>
        <div className={`${s.headerSkeleton} ${skeleton.skeleton}`} />
        <div className={`${s.bodySkeleton} ${skeleton.skeleton}`} />
      </div>
    );
  }

  const isPublished = selected?.version === doc.publishedVersion;

  return (
    <div className={s.container} data-testid="document-history">
      <SectionHeader
        icon={faArrowLeft}
        onIconClick={() => navigate(viewPath)}
        title={`${doc.title}: history`}
        subtitle={doc.publishedVersion !== null
          ? `Its exports deliver version ${doc.publishedVersion}${doc.exportable ? '' : ', once it\'s marked exportable'}.`
          : 'No version is published: its exports deliver nothing of it.'}
      />
      <div className={s.history}>
        <ul className={s.versionList} data-testid="version-list">
          {versions.map(v => (
            <li
              key={v.version}
              className={`${s.versionItem} ${selected?.version === v.version ? s.versionSelected : ''}`}
              onClick={() => select(v.version)}
              data-testid={`version-${v.version}`}
            >
              <span className={s.treeTitle}>
                Version {v.version}
                {v.version === doc.version && <span className={s.badge}>Current</span>}
                {v.version === doc.publishedVersion && <span className={s.badge}>Published</span>}
              </span>
              <small className={s.muted}>{authorLabel(v.author)} · {dateLabel(v.createdAt)}</small>
            </li>
          ))}
        </ul>

        {selected && (
          <section className={s.versionPanel}>
            <div className={s.versionToolbar}>
              <LabeledSelect
                id="version-compare" htmlFor="version-compare" label="Compare with"
                value={compareWith ? String(compareWith.version) : ''}
                onChange={e => compare(e.target.value)}
                options={[{ value: '', label: "None: show it as it reads" }, ...versions
                  .filter(v => v.version !== selected.version)
                  .map(v => ({ value: String(v.version), label: `Version ${v.version}` }))]}
              />
              {canEdit && (isPublished
                ? <SecondaryButton icon={faEyeSlash} text="Unpublish" disabled={publishing} onClick={() => publish(null)} />
                : <ActionButton icon={faUpload} text={`Publish version ${selected.version}`} isLoading={publishing} disabled={publishing} onClick={() => publish(selected.version)} />)}
            </div>
            {compareWith ? (() => {
              // Always from the older to the newer.
              const [older, newer] = compareWith.version < selected.version ? [compareWith, selected] : [selected, compareWith];
              return (
                <>
                  <div className={s.versionToolbar}>
                    <small className={s.muted}>What changed from version {older.version} to {newer.version}</small>
                    <SecondaryButton icon={faEye} text="Show it as it reads" onClick={() => setCompareWith(null)} />
                  </div>
                  <DiffView from={older.content} to={newer.content} />
                </>
              );
            })() : (
              <article className={s.page}><MarkdownView content={selected.content} /></article>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
