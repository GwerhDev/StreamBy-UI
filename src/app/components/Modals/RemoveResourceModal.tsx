import s from './RemoveResourceModal.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { faLinkSlash, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { setProjectResource, setResourceRemoving } from '../../../store/currentProjectSlice';
import { removeResource, ResourceKind } from '../../../services/projectResources';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ModalShell } from './ModalShell';
import { ResourceDependents } from './ResourceDependents';

export interface RemovableResource {
  id: string;
  name: string;
  integrationId?: string;
  isBuiltin?: boolean;
}

const NOUN: Record<ResourceKind, string> = {
  db: 'database connection', api: 'API connection', storage: 'storage connection', service: 'service connection', export: 'export', pipeline: 'pipeline',
};

// What removing it does to what it keeps, said before it's done.
function consequenceOf(kind: ResourceKind, builtin: boolean): string {
  if (kind === 'db') return builtin
    ? 'Its tables and records stay in the built-in database: connect it again (Database) and they are there.'
    : "The database itself isn't touched: only the project stops using it.";
  if (kind === 'storage') return builtin
    ? 'Its files stay in the built-in storage: connect it again (Storage) and they are there.'
    : "Its files stay in the bucket, but the project won't list them anymore.";
  if (kind === 'service') return 'The service account itself isn\'t touched: only the project stops using it.';
  if (kind === 'api') return "The API itself isn't touched: only the project stops calling it.";
  if (kind === 'export') return 'Its URL stops answering, and its deliverables are removed.';
  return 'Its nodes are deleted.';
}

interface RemoveResourceModalProps {
  kind: ResourceKind;
  resource: RemovableResource;
  onClose: () => void;
  // Removing it waits for this (the workflow's Save): confirmed, it's told instead of done.
  onConfirm?: () => void;
}

// Removing a connection, an export or a pipeline from the project: what depends on it and what
// happens to what it keeps, then the confirmation. Confirmed, it closes and the item shows it's
// being removed until the server answers with the list as it is then.
export function RemoveResourceModal({ kind, resource, onClose, onConfirm }: RemoveResourceModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const project = useSelector((state: RootState) => state.currentProject.data);
  const disconnect = kind !== 'export' && kind !== 'pipeline';
  const verb = disconnect ? 'Disconnect' : 'Delete';

  const handleRemove = async () => {
    if (onConfirm) { onConfirm(); onClose(); return; }
    if (!project) return;
    const projectId = project.id;
    dispatch(setResourceRemoving({ id: resource.id, removing: true }));
    onClose();
    try {
      const { key, value } = await removeResource(projectId, kind, resource);
      dispatch(setProjectResource({ projectId, key, value: value as never }));
      dispatch(addApiResponse({ message: `${resource.name} ${disconnect ? 'disconnected' : 'deleted'}.`, type: 'success' }));
    } catch (err) {
      dispatch(addApiResponse({ message: err instanceof Error ? err.message : `Failed to remove the ${NOUN[kind]}.`, type: 'error' }));
    } finally {
      dispatch(setResourceRemoving({ id: resource.id, removing: false }));
    }
  };

  return (
    <ModalShell
      title={`${verb} ${resource.name}`}
      icon={disconnect ? faLinkSlash : faTrash}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
          <PrimaryButton icon={disconnect ? faLinkSlash : faTrash} text={verb} onClick={handleRemove} disabled={!project} />
        </>
      }
    >
      <div className={s.body} data-testid="remove-resource">
        <p>
          {verb} the {resource.isBuiltin ? 'built-in ' : ''}{NOUN[kind]} <strong>{resource.name}</strong> from the project?
        </p>
        <p className={s.consequence}>{consequenceOf(kind, !!resource.isBuiltin)}</p>
        {onConfirm && <p className={s.consequence} data-testid="remove-on-save">It's {disconnect ? 'disconnected' : 'deleted'} when you save the workflow.</p>}
        {project && <ResourceDependents projectId={project.id} kind={kind} resourceId={resource.id} />}
      </div>
    </ModalShell>
  );
}
