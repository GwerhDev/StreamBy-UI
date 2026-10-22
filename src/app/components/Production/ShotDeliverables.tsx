import s from './ShotDeliverables.module.css';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faDownload, faFile, faFilm, faImage, faMusic, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { getAssetDownloadUrl, getDeliverables } from '../../../services/deliverables';
import { Deliverable } from '../../../interfaces';

const CATEGORY_ICON: Record<string, typeof faFile> = {
  images: faImage,
  audios: faMusic,
  videos: faFilm,
  '3d-models': faCube,
};

interface Props {
  projectId: string;
  shotId: string;
}

// What's been delivered for a shot: each asset (or version), downloadable.
export function ShotDeliverables({ projectId, shotId }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [deliverables, setDeliverables] = useState<Deliverable[] | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDeliverables(null);
    getDeliverables(projectId, { shotId })
      .then(list => { if (!cancelled) setDeliverables(list); })
      .catch(() => { if (!cancelled) setDeliverables([]); });
    return () => { cancelled = true; };
  }, [projectId, shotId]);

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

  return (
    <div className={s.section} data-testid="shot-deliverables">
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
