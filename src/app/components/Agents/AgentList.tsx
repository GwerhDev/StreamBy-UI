import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getWorkerAgents, revokeWorkerAgent, shareWorkerAgent, unshareWorkerAgent } from '../../../services/workerAgents';
import { WorkerAgent, WorkerAgentShare } from '../../../interfaces';
import { ResourceList } from '../ResourceList/ResourceList';
import { RevokeApiTokenModal } from '../ApiTokens/RevokeApiTokenModal';
import { useFormSaved, useOpenForm } from '../../../hooks/useFormRoute';
import { AgentCard } from './AgentCard';
import { ShareAgentModal } from './ShareAgentModal';

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

// The user's agents: machines of theirs that ask StreamBy for jobs. Registered, shared with
// projects or teams, and revoked here.
export const AgentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const openForm = useOpenForm();
  const saved = useFormSaved();
  const [agents, setAgents] = useState<WorkerAgent[] | null>(null);
  const [toRevoke, setToRevoke] = useState<WorkerAgent | null>(null);
  const [toShare, setToShare] = useState<WorkerAgent | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setAgents(await getWorkerAgents());
    } catch (err) {
      setAgents([]);
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to load agents.'), type: 'error' }));
    }
  }, [dispatch]);
  useEffect(() => { load(); }, [load, saved]);

  const act = async (action: () => Promise<unknown>, success: string, fallback: string, after: () => void) => {
    setBusy(true);
    try {
      await action();
      dispatch(addApiResponse({ message: success, type: 'success' }));
      after();
      await load();
    } catch (err) {
      dispatch(addApiResponse({ message: messageOf(err, fallback), type: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = () => toRevoke && act(
    () => revokeWorkerAgent(toRevoke.id), `${toRevoke.name} revoked.`, 'Failed to revoke the agent.', () => setToRevoke(null),
  );
  const handleShare = (projectId: string, teamId: string | null) => toShare && act(
    () => shareWorkerAgent(toShare.id, projectId, teamId), `${toShare.name} shared.`, 'Failed to share the agent.', () => setToShare(null),
  );
  const handleUnshare = (agent: WorkerAgent, share: WorkerAgentShare) => act(
    () => unshareWorkerAgent(agent.id, share.id), `${agent.name} is no longer shared with ${share.projectName ?? 'that project'}.`, 'Failed to stop sharing the agent.', () => {},
  );

  return (
    <>
      <ResourceList
        icon={faDesktop}
        title="Agents"
        subtitle="Your machines that process assets: they connect to StreamBy and ask for jobs, no public address needed. Share each one with the projects or teams that may use it."
        items={(agents ?? []).map(agent => ({
          id: agent.id,
          card: (
            <AgentCard
              agent={agent} onRevoke={() => setToRevoke(agent)} onShare={() => setToShare(agent)}
              onUnshare={share => handleUnshare(agent, share)}
            />
          ),
        }))}
        loading={agents === null}
        onAdd={() => openForm('/user/agents/create')}
        addLabel="Register an agent"
      />
      {toRevoke && (
        <RevokeApiTokenModal
          name={toRevoke.name} busy={busy} onConfirm={handleRevoke} onClose={() => setToRevoke(null)}
          message="Its token stops working right away, and its jobs, queued or running, fail. This can't be undone."
        />
      )}
      {toShare && <ShareAgentModal agent={toShare} busy={busy} onShare={handleShare} onClose={() => setToShare(null)} />}
    </>
  );
};
