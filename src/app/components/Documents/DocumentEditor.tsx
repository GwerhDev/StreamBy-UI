import s from './Documents.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { faArrowLeft, faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { upsertDocument } from '../../../store/documentsSlice';
import { conflictOf, getDocument, saveDocument } from '../../../services/documents';
import { ProjectDocument } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { MarkdownView } from './MarkdownView';
import { DiffView } from './DiffView';
import { authorLabel } from './documentText';
import { useDocumentEvents } from './useDocumentEvents';
import { useDocumentList } from './useDocumentList';

// A document, edited: markdown and its preview. A save is made on the version it was opened at;
// if someone saves another one meanwhile, nothing is overwritten: it says so, shows what they
// changed, and the editor chooses.
export const DocumentEditor = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { id: projectId = '', docId = '' } = useParams<{ id: string; docId: string }>();
  const viewPath = `/project/${projectId}/dashboard/documents/${docId}`;
  useDocumentList(projectId);
  // The version the text was taken from: a save is made on it.
  const [base, setBase] = useState<ProjectDocument | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // A version someone saved after `base`.
  const [newer, setNewer] = useState<ProjectDocument | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only the latest load sets the text: an answer arriving after typing began would erase it.
  useEffect(() => {
    let cancelled = false;
    getDocument(projectId, docId)
      .then(doc => {
        if (cancelled) return;
        // A credits sheet isn't written: it's edited in its table.
        if (doc.kind === 'credits') { navigate(`/project/${projectId}/dashboard/documents/${encodeURIComponent(doc.id)}`, { replace: true }); return; }
        setBase(doc); setTitle(doc.title); setContent(doc.content);
      })
      .catch(err => {
        if (cancelled) return;
        dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to load the document.', type: 'error' }));
        navigate(`/project/${projectId}/dashboard/documents`);
      });
    return () => { cancelled = true; };
  }, [dispatch, navigate, projectId, docId]);

  useDocumentEvents(projectId, docId, async event => {
    if (event.action === 'deleted') {
      dispatch(addApiResponse({ message: `${authorLabel(event.author)} deleted the document you were editing.`, type: 'error' }));
      navigate(`/project/${projectId}/dashboard/documents`);
      return;
    }
    if (event.action !== 'saved' || !base || (event.version ?? 0) <= base.version) return;
    try {
      setNewer(await getDocument(projectId, docId));
    } catch { /* told again on save */ }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!base || !title.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await saveDocument(projectId, docId, base.version, { title: title.trim(), content });
      dispatch(upsertDocument(saved));
      dispatch(addApiResponse({ message: `Saved as version ${saved.version}.`, type: 'success' }));
      navigate(viewPath);
    } catch (err) {
      const current = conflictOf(err);
      if (current) setNewer(current);
      else dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to save it.', type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  // Saving goes on top of their version: what they changed is replaced by this text.
  const keepMine = () => { setBase(newer); setNewer(null); setShowChanges(false); };
  const takeTheirs = () => {
    if (!newer) return;
    setBase(newer); setTitle(newer.title); setContent(newer.content); setNewer(null); setShowChanges(false);
  };

  if (!base) {
    return (
      <div className={s.container}>
        <div className={`${s.headerSkeleton} ${skeleton.skeleton}`} />
        <div className={`${s.bodySkeleton} ${skeleton.skeleton}`} />
      </div>
    );
  }

  return (
    <form className={s.container} onSubmit={handleSave} data-testid="document-editor">
      <SectionHeader
        icon={faArrowLeft}
        onIconClick={() => navigate(viewPath)}
        title={`Editing ${base.title}`}
        subtitle={`On version ${base.version}. Saving makes version ${base.version + 1}; it's a draft until a version is published.`}
        action={(
          <span className={s.actions}>
            <SecondaryButton icon={faXmark} text="Cancel" onClick={() => navigate(viewPath)} />
            <ActionButton type="submit" icon={faFloppyDisk} text="Save" isLoading={saving} disabled={!title.trim() || saving || !!newer} />
          </span>
        )}
      />

      {newer && (
        <div className={s.warning} data-testid="document-newer">
          <p>
            {authorLabel(newer.updatedBy)} saved version {newer.version} while you were editing. Your text isn't changed, and nothing
            is saved until you choose.
          </p>
          <div className={s.actions}>
            <SecondaryButton text={showChanges ? 'Hide their changes' : 'See their changes'} onClick={() => setShowChanges(v => !v)} />
            <SecondaryButton text="Take their version" onClick={takeTheirs} />
            <ActionButton type="button" text="Keep mine on top of it" onClick={keepMine} />
          </div>
          {showChanges && <DiffView from={base.content} to={newer.content} />}
        </div>
      )}

      <LabeledInput id="document-title" htmlFor="document-title" name="document-title" type="text" label="Title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <div className={s.editorPanes}>
        <textarea
          className={s.editorText}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write in markdown: # A title, ## A section, - a list, **bold**, `code`..."
          aria-label="Content"
          data-testid="document-content"
          spellCheck
        />
        <div className={s.editorPreview} aria-label="Preview">
          <MarkdownView content={content} />
        </div>
      </div>
    </form>
  );
};
