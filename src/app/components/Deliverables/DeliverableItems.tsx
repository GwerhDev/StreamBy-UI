import s from './DeliverableItems.module.css';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faDownload, faFile, faFilm, faImage, faMusic, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getAssetDownloadUrl, getDeliverables, startDeliverableWorkers } from '../../../services/deliverables';
import { Deliverable } from '../../../interfaces';
import { GateStatus } from './GateStatus';
import { WaitingWorkers } from './WaitingWorkers';
import { useRoleCan } from '../../../hooks/useRoleCan';

const CATEGORY_ICON: Record<string, typeof faFile> = {
  images: faImage,
  audios: faMusic,
  videos: faFilm,
  '3d-models': faCube,
};

interface Props {
  projectId: string;
  // What they were delivered for: a shot, or an export.
  of: { shotId: string } | { exportId: string };
}

// What's been delivered for a shot or an export: each asset (or version), downloadable, and
// whether the gates before it in the workflow let it out (read again when one changes). One
// ready whose workers are still waiting says so, and who can run jobs in the project starts them.
export function DeliverableItems({ projectId, of }: Props) {
  const shotId = 'shotId' in of ? of.shotId : undefined;
  const exportId = 'exportId' in of ? of.exportId : undefined;
  const dispatch = useDispatch<AppDispatch>();
  const [deliverables, setDeliverables] = useState<Deliverable[] | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const gateChanges = useSelector((state: RootState) => state.deliverableGates?.eventSeq ?? 0);
  const myRole = useSelector((state: RootState) =>
    state.currentProject?.data?.members?.find(m => m.userId === state.session?.userId)?.role);
  const canRunJobs = useRoleCan(projectId, myRole, 'jobs:run');
  const [starting, setStarting] = useState<string | null>(null);
  // Read again after its workers are started.
  const [reads, setReads] = useState(0);

  // Another shot or export: its own, from nothing.
  useEffect(() => { setDeliverables(null); }, [projectId, shotId, exportId]);
  useEffect(() => {
    let cancelled = false;
    getDeliverables(projectId, shotId ? { shotId } : { exportId })
      .then(list => { if (!cancelled) setDeliverables(list); })
      .catch(() => { if (!cancelled) setDeliverables(prev => prev ?? []); });
    return () => { cancelled = true; };
  }, [projectId, shotId, exportId, gateChanges, reads]);

  const download = async (deliverable: Deliverable) => {
    setDownloading(deliverable.id);
    try {
      window.location.assign(await getAssetDownloadUrl(projectId, deliverable.assetId, deliverable.versionId));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : 'Failed to download.', type: 'error' }));
    } finally {
      setDownloading(null);
    }
  };

  const startWorkers = async (deliverable: Deliverable) => {
    setStarting(deliverable.id);
    try {
      const { jobs } = await startDeliverableWorkers(projectId, deliverable.id);
      dispatch(addApiResponse({ message: jobs.length === 1 ? '1 job started.' : `${jobs.length} jobs started.`, type: 'success' }));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error && err.message ? err.message : "Failed to start the deliverable's workers.", type: 'error' }));
    } finally {
      setStarting(null);
      setReads(n => n + 1);
    }
  };

  return (
    <div className={s.section} data-testid="deliverables">
      <span className={s.label}>
        Deliverables
        {!!deliverables?.length && <span className={s.count}>{deliverables.length}</span>}
      </span>
      {deliverables === null ? (
        <FontAwesomeIcon icon={faSpinner} spin className={s.loading} />
      ) : deliverables.length === 0 ? (
        <p className={s.empty}>Nothing delivered yet.</p>
      ) : (
        <ul className={s.list}>
          {deliverables.map(d => (
            <li key={d.id} className={s.row} data-testid={`deliverable-${d.id}`}>
              <FontAwesomeIcon icon={CATEGORY_ICON[d.asset?.category ?? ''] ?? faFile} className={s.icon} />
              <span className={s.info}>
                <span className={s.name}>{d.asset?.displayName ?? 'Deleted asset'}</span>
                {d.note && <small className={s.note}>{d.note}</small>}
                <GateStatus state={d} />
                {d.workersWaiting && <WaitingWorkers canStart={canRunJobs} starting={starting === d.id} onStart={() => startWorkers(d)} />}
              </span>
              <span className={s.version}>{d.version ? `v${d.version}` : 'latest'}</span>
              <button
                type="button" className={s.downloadBtn} title="Download" aria-label={`Download ${d.asset?.displayName ?? ''}`}
                disabled={!d.asset || downloading === d.id} onClick={() => download(d)}
              >
                <FontAwesomeIcon icon={downloading === d.id ? faSpinner : faDownload} spin={downloading === d.id} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
