import s from './ApiTokenList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faLock, faPlus } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { useProjects } from '../../../hooks/useProjects';
import { getApiTokens, revokeApiToken } from '../../../services/apiTokens';
import { ApiToken } from '../../../interfaces';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ActionButton } from '../Buttons/ActionButton';
import { ApiTokenCard } from '../Cards/ApiTokenCard';
import { RevokeApiTokenModal } from './RevokeApiTokenModal';
import { apiTokensPath } from './paths';
import { useFormSaved, useOpenForm } from '../../../hooks/useFormRoute';

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

interface ApiTokenListProps {
  // A project's tokens (its admins only); without it, the user's own.
  projectId?: string;
}

export const ApiTokenList = ({ projectId }: ApiTokenListProps) => {
  const openForm = useOpenForm();
  const dispatch = useDispatch<AppDispatch>();
  const { projectList } = useProjects();
  const session = useSelector((state: RootState) => state.session);
  const currentProject = useSelector((state: RootState) => state.currentProject.data);
  // Within a project, only its admins manage its tokens.
  const allowed = !projectId || currentProject?.members?.find(m => m.userId === session.userId)?.role === 'admin';

  const [tokens, setTokens] = useState<ApiToken[] | null>(null);
  const [toRevoke, setToRevoke] = useState<ApiToken | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setTokens(await getApiTokens(projectId));
    } catch (err) {
      setTokens([]);
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to load API tokens.'), type: 'error' }));
    }
  }, [dispatch, projectId]);

  const saved = useFormSaved();
  useEffect(() => { if (allowed) load(); }, [allowed, load, saved]);

  const projectName = (id: string) => projectList.list.find(p => p.id === id)?.name ?? id;
  const handleCreate = () => openForm(`${apiTokensPath(projectId)}/create`);

  const handleRevoke = async () => {
    if (!toRevoke) return;
    setBusy(true);
    try {
      await revokeApiToken(toRevoke.id, projectId);
      dispatch(addApiResponse({ message: `${toRevoke.name} revoked.`, type: 'success' }));
      setToRevoke(null);
      await load();
    } catch (err) {
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to revoke API token.'), type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  const isEmpty = tokens !== null && tokens.length === 0;

  return (
    <div className={s.container} data-testid="api-token-list-page">
      <SectionHeader
        icon={faKey}
        title={projectId ? 'Project API tokens' : 'Personal API tokens'}
        subtitle={projectId
          ? "The project's own tokens, for integrations that work on it: CI, services, agents. They keep working whoever leaves the project."
          : 'Let agents and services work with StreamBy as you, without your session.'}
        action={allowed && isEmpty ? <ActionButton icon={faPlus} text="New token" onClick={handleCreate} /> : undefined}
      />

      {!allowed ? (
        <div className={s.emptyState} data-testid="api-token-admins-only">
          <EmptyBackground icon={faLock} title="Admins only" subtitle="Only the project's admins manage its API tokens." />
        </div>
      ) : tokens === null ? (
        <ul>
          {Array.from({ length: 2 }).map((_, i) => <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />)}
        </ul>
      ) : isEmpty ? (
        <div className={s.emptyState} data-testid="api-token-empty">
          <EmptyBackground />
        </div>
      ) : (
        <ul data-testid="api-token-list">
          {tokens.map(token => (
            <li key={token.id} data-testid={`api-token-${token.id}`}>
              <ApiTokenCard token={token} projectName={projectName} onRevoke={() => setToRevoke(token)} />
            </li>
          ))}
          <li className={s.createItem} data-testid="api-token-new" onClick={handleCreate}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>New token</h4>
          </li>
        </ul>
      )}

      {toRevoke && (
        <RevokeApiTokenModal name={toRevoke.name} busy={busy} onConfirm={handleRevoke} onClose={() => setToRevoke(null)} />
      )}
    </div>
  );
};
