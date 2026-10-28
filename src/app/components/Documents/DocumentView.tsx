import s from './Documents.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { faClockRotateLeft, faFileLines, faPen, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { upsertDocument } from '../../../store/documentsSlice';
import { getDocument, updateDocument } from '../../../services/documents';
import { ProjectDocument } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { MarkdownView } from './MarkdownView';
import { DocumentTree, folderOptions } from './DocumentTree';
import { authorLabel, dateLabel, useDocumentsRole } from './documentText';
import { useDocumentEvents } from './useDocumentEvents';
import { useDocumentList } from './useDocumentList';
import { CreditsSheetView } from '../Credits/CreditsSheetView';

// A document, read: it follows the changes others make while it's open, and says who made them.
export const DocumentView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '', docId = '' } = useParams<{ id: string; docId: string }>();
  const { canEdit } = useDocumentsRole();
  const list = useDocumentList(projectId);
  const [doc, setDoc] = useState<ProjectDocument | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const listPath = `/project/${projectId}/dashboard/documents`;

  // Only the latest load shows: an earlier one (another document's) may answer after it.
  const latest = useRef(0);
  const load = useCallback(async () => {
    const mine = ++latest.current;
    try {
      const loaded = await getDocument(projectId, docId);
      if (mine !== latest.current) return null;
      setDoc(loaded);
      return loaded;
    } catch (err) {
      if (mine !== latest.current) return null;
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to load the document.', type: 'error' }));
      navigate(listPath);
      return null;
    }
  }, [dispatch, navigate, projectId, docId, listPath]);

  useEffect(() => {
    setDoc(null);
    setNotice(null);
    load();
  }, [load]);

  useDocumentEvents(projectId, docId, async event => {
    if (event.action === 'deleted') {
      dispatch(addApiResponse({ message: `${authorLabel(event.author)} deleted ${doc?.title ?? 'the document'}.`, type: 'error' }));
      navigate(listPath);
      return;
    }
    const loaded = await load();
    if (loaded && event.action === 'saved') setNotice(`Updated to version ${event.version} by ${authorLabel(event.author)}.`);
  });

  const change = async (patch: { exportable?: boolean; parentId?: string | null }) => {
    try {
      const updated = await updateDocument(projectId, docId, patch);
      setDoc(updated);
      dispatch(upsertDocument(updated));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to change it.', type: 'error' }));
    }
  };

  if (!doc) {
    return (
      <div className={s.container}>
        <div className={`${s.headerSkeleton} ${skeleton.skeleton}`} />
        <div className={`${s.bodySkeleton} ${skeleton.skeleton}`} />
      </div>
    );
  }

  // A folder is entered: what's in it.
  if (doc.kind === 'folder') return <DocumentTree folder={doc} />;
  // A credits sheet is read as its table, from its assets.
  if (doc.kind === 'credits') return <CreditsSheetView />;

  return (
    <div className={s.container} data-testid="document-view">
      <SectionHeader
        icon={faFileLines}
        title={doc.title}
        subtitle={`Version ${doc.version} · saved by ${authorLabel(doc.updatedBy)}, ${dateLabel(doc.updatedAt)}`}
        badge={doc.publishedVersion !== null ? `Published v${doc.publishedVersion}` : 'Draft'}
        action={(
          <span className={s.actions}>
            <SecondaryButton icon={faClockRotateLeft} text="History" onClick={() => navigate(`${listPath}/${docId}/versions`)} />
            {canEdit && <ActionButton icon={faPen} text="Edit" onClick={() => navigate(`${listPath}/${docId}/edit`)} />}
          </span>
        )}
      />

      {notice && (
        <div className={s.notice} data-testid="document-notice">
          <span>{notice}</span>
          <button type="button" className={s.iconButton} aria-label="Dismiss" onClick={() => setNotice(null)}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {canEdit && (
        <div className={s.settings}>
          <CustomCheckbox
            id="document-exportable" name="document-exportable" checked={doc.exportable}
            label="Exportable: its exports deliver the version published from its history"
            onChange={e => change({ exportable: e.target.checked })}
          />
          {list && (
            <LabeledSelect
              id="document-move" htmlFor="document-move" label="Folder" value={doc.parentId ?? ''}
              options={folderOptions(list, doc.id)}
              onChange={e => change({ parentId: e.target.value || null })}
            />
          )}
        </div>
      )}

      <article className={s.page}>
        <MarkdownView content={doc.content} />
      </article>
    </div>
  );
};
