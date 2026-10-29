import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { getAssetDownloadUrl } from '../../../services/deliverables';
import s from './AssetThumbnail.module.css';

// A shot's linked asset, small: its image, or an icon when it isn't one (or can't be fetched).
export function AssetThumbnail({ projectId, assetId, className }: { projectId: string; assetId: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setBroken(false);
    getAssetDownloadUrl(projectId, assetId)
      .then(u => { if (!cancelled) setUrl(u); })
      .catch(() => { if (!cancelled) setBroken(true); });
    return () => { cancelled = true; };
  }, [projectId, assetId]);

  return (
    <div className={`${s.thumb} ${className ?? ''}`} data-testid="asset-thumbnail">
      {url && !broken
        ? <img src={url} alt="" onError={() => setBroken(true)} />
        : <FontAwesomeIcon icon={faImage} />}
    </div>
  );
}
