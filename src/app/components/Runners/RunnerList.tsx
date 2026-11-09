import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getWorkerRunners, revokeWorkerRunner, shareWorkerRunner, unshareWorkerRunner } from '../../../services/workerRunners';
import { WorkerRunner, WorkerRunnerShare } from '../../../interfaces';
import { ResourceList } from '../ResourceList/ResourceList';
import { RevokeApiTokenModal } from '../ApiTokens/RevokeApiTokenModal';
import { useFormSaved, useOpenForm } from '../../../hooks/useFormRoute';
import { RunnerCard } from './RunnerCard';
import { ShareRunnerModal } from './ShareRunnerModal';

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

// The user's runners: machines of theirs that ask StreamBy for jobs. Registered, shared with
// projects or teams, and revoked here.
export const RunnerList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const openForm = useOpenForm();
  const saved = useFormSaved();
  const [runners, setRunners] = useState<WorkerRunner[] | null>(null);
  const [toRevoke, setToRevoke] = useState<WorkerRunner | null>(null);
  const [toShare, setToShare] = useState<WorkerRunner | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRunners(await getWorkerRunners());
    } catch (err) {
      setRunners([]);
      dispatch(addApiResponse({ message: messageOf(err, 'Failed to load runners.'), type: 'error' }));
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
    () => revokeWorkerRunner(toRevoke.id), `${toRevoke.name} revoked.`, 'Failed to revoke the runner.', () => setToRevoke(null),
  );
  const handleShare = (projectId: string, teamId: string | null) => toShare && act(
    () => shareWorkerRunner(toShare.id, projectId, teamId), `${toShare.name} shared.`, 'Failed to share the runner.', () => setToShare(null),
  );
  const handleUnshare = (runner: WorkerRunner, share: WorkerRunnerShare) => act(
    () => unshareWorkerRunner(runner.id, share.id), `${runner.name} is no longer shared with ${share.projectName ?? 'that project'}.`, 'Failed to stop sharing the runner.', () => {},
  );

  return (
    <>
      <ResourceList
        icon={faDesktop}
        title="Runners"
        subtitle="Your machines that process assets: they connect to StreamBy and ask for jobs, no public address needed. Share each one with the projects or teams that may use it."
        items={(runners ?? []).map(runner => ({
          id: runner.id,
          card: (
            <RunnerCard
              runner={runner} onRevoke={() => setToRevoke(runner)} onShare={() => setToShare(runner)}
              onUnshare={share => handleUnshare(runner, share)}
            />
          ),
        }))}
        loading={runners === null}
        onAdd={() => openForm('/user/runners/create')}
        addLabel="Register a runner"
      />
      {toRevoke && (
        <RevokeApiTokenModal
          name={toRevoke.name} busy={busy} onConfirm={handleRevoke} onClose={() => setToRevoke(null)}
          message="Its token stops working right away, and its jobs, queued or running, fail. This can't be undone."
        />
      )}
      {toShare && <ShareRunnerModal runner={toShare} busy={busy} onShare={handleShare} onClose={() => setToShare(null)} />}
    </>
  );
};
