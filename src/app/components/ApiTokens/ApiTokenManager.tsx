import s from './ApiTokenManager.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faKey, faPlus, faTrash, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjects } from '../../../hooks/useProjects';
import { createApiToken, getApiTokens, revokeApiToken } from '../../../services/apiTokens';
import { ApiToken, ApiTokenAccess } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import CopyButton from '../Buttons/CopyButton';
import { LabeledInput } from '../Inputs/LabeledInput';
import { LabeledSelect } from '../Inputs/LabeledSelect';
import { CustomCheckbox } from '../Inputs/CustomCheckbox';
import { RevokeApiTokenModal } from './RevokeApiTokenModal';

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'never', label: 'No expiration' },
];

const ACCESS_OPTIONS = [
  { value: 'read', label: 'Read only' },
  { value: 'write', label: 'Read and write' },
];

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : null);
const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

interface ApiTokenManagerProps {
  // Within a project: only the tokens that reach it, and a new one reaching it.
  projectId?: string;
}

// The user's API tokens, to let agents and services work with StreamBy as them: made with a
// name, an access (read or write), the projects they reach and an expiry; shown once when made;
// listed and revoked.
export const ApiTokenManager = ({ projectId }: ApiTokenManagerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { projectList } = useProjects();
  const projects = projectList.list;

  const [tokens, setTokens] = useState<ApiToken[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<ApiToken | null>(null);

  const [name, setName] = useState('');
  const [access, setAccess] = useState<ApiTokenAccess>('read');
  const [allProjects, setAllProjects] = useState(false);
  const [chosen, setChosen] = useState<string[]>(projectId ? [projectId] : []);
  const [expiry, setExpiry] = useState('30');

  const load = useCallback(async () => {
    try {
      setTokens(await getApiTokens());
    } catch (err) {
      setTokens([]);
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to load API tokens.'), type: 'error' }));
    }
  }, [dispatch]);

  useEffect(() => { load(); }, [load]);

  const shown = useMemo(
    () => (tokens ?? []).filter(t => !projectId || t.projectIds === '*' || t.projectIds.includes(projectId)),
    [tokens, projectId],
  );
  const projectName = (id: string) => projects.find(p => p.id === id)?.name ?? id;

  const resetForm = () => {
    setName('');
    setAccess('read');
    setAllProjects(false);
    setChosen(projectId ? [projectId] : []);
    setExpiry('30');
  };

  const canCreate = name.trim() !== '' && (allProjects || chosen.length > 0) && !busy;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setBusy(true);
    try {
      const { token } = await createApiToken({
        name: name.trim(),
        access,
        projectIds: allProjects ? '*' : chosen,
        expiresInDays: expiry === 'never' ? null : Number(expiry),
      });
      setCreated(token);
      setCreating(false);
      resetForm();
      await load();
    } catch (err) {
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to create API token.'), type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async () => {
    if (!toRevoke) return;
    setBusy(true);
    try {
      await revokeApiToken(toRevoke.id);
      dispatch(addApiResponse({ message: `${toRevoke.name} revoked.`, type: 'success' }));
      setToRevoke(null);
      await load();
    } catch (err) {
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to revoke API token.'), type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  const toggleProject = (id: string, on: boolean) =>
    setChosen(list => (on ? [...new Set([...list, id])] : list.filter(p => p !== id)));

  return (
    <div className={s.container} data-testid="api-token-manager">
      <SectionHeader
        icon={faKey}
        title="API tokens"
        subtitle={projectId
          ? 'Your tokens that reach this project. Agents and services use them to work with StreamBy as you.'
          : 'Let agents and services work with StreamBy as you, without your session.'}
      />

      {created && (
        <div className={s.created} data-testid="api-token-created">
          <p className={s.createdTitle}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
            Copy your token now. It won't be shown again.
          </p>
          <div className={s.tokenRow}>
            <code className={s.token} data-testid="api-token-value">{created}</code>
            <CopyButton title="Copy token" textToCopy={created} copiedMessage="Token copied to clipboard." />
          </div>
          <div className={s.actions}>
            <ActionButton icon={faCheck} text="Done" onClick={() => setCreated(null)} />
          </div>
        </div>
      )}

      {creating && (
        <form className={s.form} onSubmit={handleCreate} data-testid="api-token-form">
          <LabeledInput
            id="api-token-name" htmlFor="api-token-name" name="api-token-name" type="text"
            label="Name" placeholder="e.g. Claude Code on my laptop" value={name}
            onChange={e => setName(e.target.value)}
          />
          <LabeledSelect
            id="api-token-access" htmlFor="api-token-access" label="Access" value={access}
            options={ACCESS_OPTIONS} onChange={e => setAccess(e.target.value as ApiTokenAccess)}
          />
          <fieldset className={s.projects}>
            <legend>Projects</legend>
            <CustomCheckbox
              id="api-token-all-projects" name="api-token-all-projects" checked={allProjects}
              label="All my projects, including ones I join later"
              onChange={e => setAllProjects(e.target.checked)}
            />
            {!allProjects && (projectId ? (
              <p className={s.hint}>This project only.</p>
            ) : (
              <div className={s.projectList}>
                {projects.length === 0 && <p className={s.hint}>You have no projects yet.</p>}
                {projects.map(p => (
                  <CustomCheckbox
                    key={p.id} id={`api-token-project-${p.id}`} name="api-token-project" value={p.id}
                    checked={chosen.includes(p.id)} label={p.name}
                    onChange={e => toggleProject(p.id, e.target.checked)}
                  />
                ))}
              </div>
            ))}
          </fieldset>
          <LabeledSelect
            id="api-token-expiry" htmlFor="api-token-expiry" label="Expiration" value={expiry}
            options={EXPIRY_OPTIONS} onChange={e => setExpiry(e.target.value)}
          />
          {expiry === 'never' && (
            <p className={s.warning} data-testid="api-token-never-warning">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              A token without expiration works until you revoke it.
            </p>
          )}
          <div className={s.actions}>
            <ActionButton type="submit" icon={faKey} text="Create token" disabled={!canCreate} isLoading={busy} />
            <SecondaryButton icon={faXmark} text="Cancel" disabled={busy} onClick={() => { setCreating(false); resetForm(); }} />
          </div>
        </form>
      )}

      {tokens === null ? (
        <ul>
          {Array.from({ length: 2 }).map((_, i) => <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />)}
        </ul>
      ) : (
        <ul data-testid="api-token-list">
          {shown.map(token => (
            <li key={token.id} data-testid={`api-token-${token.id}`}>
              <span className={s.cardLeft}>
                <span className={s.cardIcon}><FontAwesomeIcon icon={faKey} /></span>
                <span className={s.cardInfo}>
                  <h4>{token.name}</h4>
                  <small>
                    <code>{token.prefix}…</code>
                    {' · '}{token.access === 'write' ? 'Read and write' : 'Read only'}
                    {' · '}{token.projectIds === '*' ? 'All my projects' : token.projectIds.map(projectName).join(', ')}
                  </small>
                  <small>
                    Created {formatDate(token.createdAt)}
                    {' · '}{token.lastUsedAt ? `Last used ${formatDate(token.lastUsedAt)}` : 'Never used'}
                    {' · '}{token.expiresAt ? `Expires ${formatDate(token.expiresAt)}` : 'No expiration'}
                  </small>
                </span>
              </span>
              <span className={s.cardRight}>
                <button
                  type="button" className={s.revokeBtn} title="Revoke token"
                  data-testid={`api-token-revoke-${token.id}`} onClick={() => setToRevoke(token)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </span>
            </li>
          ))}
          {!creating && (
            <li className={s.createItem} data-testid="api-token-new" onClick={() => { setCreated(null); setCreating(true); }}>
              <FontAwesomeIcon icon={faPlus} />
              <h4>New token</h4>
            </li>
          )}
        </ul>
      )}

      {toRevoke && (
        <RevokeApiTokenModal name={toRevoke.name} busy={busy} onConfirm={handleRevoke} onClose={() => setToRevoke(null)} />
      )}
    </div>
  );
};
