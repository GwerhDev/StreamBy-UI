import s from './RemoveResourceModal.module.css';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Dependent, getDependents, ResourceKind } from '../../../services/projectResources';

const plural = (n: number | undefined, one: string) => `${n ?? 0} ${one}${n === 1 ? '' : 's'}`;

const lineOf = (d: Dependent): string => {
  if (d.type === 'workflow') return `The workflow: ${d.name} (${plural(d.count, 'node')})`;
  if (d.type === 'export') return `Export ${d.name} (${plural(d.count, 'node')})`;
  if (d.type === 'pipeline') return `Pipeline ${d.name} (${plural(d.count, 'node')})`;
  if (d.type === 'files') return plural(d.count, 'file');
  if (d.type === 'folders') return plural(d.count, 'folder');
  if (d.type === 'deliverables') return plural(d.count, 'deliverable');
  return plural(d.count, 'shot');
};

// What depends on a resource of the project: nodes that use it stop working when it's gone.
export function ResourceDependents({ projectId, kind, resourceId }: { projectId: string; kind: ResourceKind; resourceId: string }) {
  const [dependents, setDependents] = useState<Dependent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDependents(null);
    setError(null);
    getDependents(projectId, kind, resourceId)
      .then(found => { if (!cancelled) setDependents(found); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to check what depends on it.'); });
    return () => { cancelled = true; };
  }, [projectId, kind, resourceId]);

  if (error) return <p className={s.warning} data-testid="resource-dependents-error"><FontAwesomeIcon icon={faTriangleExclamation} /> Couldn't check what depends on it: {error}</p>;
  if (!dependents) return <p className={s.muted}><FontAwesomeIcon icon={faSpinner} spin /> Checking what depends on it…</p>;
  if (!dependents.length) return <p className={s.muted} data-testid="resource-dependents-none">Nothing in the project depends on it.</p>;
  const usedBy = dependents.filter(d => ['workflow', 'export', 'pipeline'].includes(d.type));
  const kept = dependents.filter(d => !usedBy.includes(d));
  return (
    <div className={s.dependents} data-testid="resource-dependents">
      {usedBy.length > 0 && (
        <>
          <p className={s.warning}><FontAwesomeIcon icon={faTriangleExclamation} /> Used by these, which stop working without it:</p>
          <ul>{usedBy.map(d => <li key={`${d.type}-${d.id ?? d.name}`}>{lineOf(d)}</li>)}</ul>
        </>
      )}
      {kept.length > 0 && (
        <>
          <p className={s.label}>Kept for it:</p>
          <ul>{kept.map(d => <li key={d.type}>{lineOf(d)}</li>)}</ul>
        </>
      )}
    </div>
  );
}
