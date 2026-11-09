import s from './DeliverableTab.module.css';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { markDeliverable } from '../../../services/deliverables';
import { useRoleCan } from '../../../hooks/useRoleCan';
import { StorageFile } from '../../../interfaces';
import { DeliverableItems } from '../Deliverables/DeliverableItems';
import { AssetPickerModal } from '../Modals/AssetPickerModal';
import { ActionButton } from '../Buttons/ActionButton';

interface DeliverableTabProps {
  projectId: string;
  exportId: string;
}

// The assets delivered for this export, and (for who can write the project's assets) adding
// more: each asset picked is marked as one, and the list read again shows whether it's ready or
// what blocks it.
export function DeliverableTab({ projectId, exportId }: DeliverableTabProps) {
  const dispatch = useDispatch<AppDispatch>();
  const myRole = useSelector((state: RootState) =>
    state.currentProject?.data?.members?.find(m => m.userId === state.session?.userId)?.role);
  const canAdd = useRoleCan(projectId, myRole, 'assets:write');
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState(false);
  const [reload, setReload] = useState(0);

  const add = async (files: StorageFile[]) => {
    setPicking(false);
    setAdding(true);
    let added = 0;
    let blocked = 0;
    for (const file of files) {
      try {
        const { deliverable } = await markDeliverable(projectId, file.id, { exportId });
        added++;
        if (deliverable.status === 'blocked') blocked++;
      } catch (err) {
        dispatch(addApiResponse({ message: `${file.displayName}: ${err instanceof Error ? err.message : 'Failed to add it.'}`, type: 'error' }));
      }
    }
    setAdding(false);
    setReload(n => n + 1);
    if (added) {
      const what = added === 1 ? '1 deliverable added' : `${added} deliverables added`;
      dispatch(addApiResponse({ message: blocked ? `${what} (${blocked} blocked by the gates before it).` : `${what}.`, type: 'success' }));
    }
  };

  return (
    <div className={s.container}>
      <DeliverableItems
        projectId={projectId}
        of={{ exportId }}
        reload={reload}
        actions={canAdd && (
          <ActionButton icon={faPlus} text="Add deliverable" isLoading={adding} disabled={adding} onClick={() => setPicking(true)} />
        )}
      />
      {picking && (
        <AssetPickerModal
          projectId={projectId}
          title="Add deliverables"
          actionText="Add"
          onInsert={add}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
