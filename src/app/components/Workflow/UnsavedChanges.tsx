import { useContext, useEffect } from 'react';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';
import { faFloppyDisk, faPencil, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { ModalShell } from '../Modals/ModalShell';
import { ActionButton } from '../Buttons/ActionButton';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface UnsavedChangesModalProps {
  saving: boolean;
  // What the user was going to do: go to view mode, or leave the page.
  leaving: string;
  onKeep: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

// Changes not saved, and something about to leave them behind: keep editing, discard, or save.
export function UnsavedChangesModal({ saving, leaving, onKeep, onDiscard, onSave }: UnsavedChangesModalProps) {
  return (
    <ModalShell
      title="Unsaved changes"
      icon={faFloppyDisk}
      onClose={onKeep}
      footer={
        <>
          <SecondaryButton icon={faPencil} text="Keep editing" onClick={onKeep} disabled={saving} />
          <PrimaryButton icon={faRotateLeft} text="Discard" onClick={onDiscard} disabled={saving} />
          <ActionButton icon={faFloppyDisk} text="Save" onClick={onSave} isLoading={saving} disabled={saving} />
        </>
      }
    >
      <p data-testid="workflow-leave">The workflow has changes that aren't saved. Save them, or discard them, before {leaving}.</p>
    </ModalShell>
  );
}

// Holds a navigation away (a link, the menu, back) while there are changes, until it's decided
// what to do with them; reloading or closing the tab asks the browser's own question.
function NavigationGuard({ when, saving, onSave, onDiscard }: { when: boolean; saving: boolean; onSave: () => Promise<boolean>; onDiscard: () => void }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!when) return;
    const ask = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', ask);
    return () => window.removeEventListener('beforeunload', ask);
  }, [when]);

  if (blocker.state !== 'blocked') return null;
  return (
    <UnsavedChangesModal
      saving={saving}
      leaving="leaving the page"
      onKeep={() => blocker.reset?.()}
      onDiscard={() => { onDiscard(); blocker.proceed?.(); }}
      onSave={async () => { if (await onSave()) blocker.proceed?.(); }}
    />
  );
}

/** The navigation guard, where the router can hold a navigation (a data router). */
export function UnsavedChangesGuard(props: { when: boolean; saving: boolean; onSave: () => Promise<boolean>; onDiscard: () => void }) {
  return useContext(UNSAFE_DataRouterContext) ? <NavigationGuard {...props} /> : null;
}
