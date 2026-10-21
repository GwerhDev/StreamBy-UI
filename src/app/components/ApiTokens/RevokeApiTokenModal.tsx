import s from './RevokeApiTokenModal.module.css';
import { faBan, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ModalShell } from '../Modals/ModalShell';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface RevokeApiTokenModalProps {
  name: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const RevokeApiTokenModal = ({ name, busy, onConfirm, onClose }: RevokeApiTokenModalProps) => (
  <ModalShell title={`Revoke ${name}`} onClose={onClose}>
    <div className={s.body}>
      <p>Anything using this token stops working right away. This can't be undone.</p>
      <div className={s.actions}>
        <PrimaryButton type="button" disabled={busy} icon={faBan} text="Revoke" onClick={onConfirm} />
        <SecondaryButton disabled={busy} icon={faXmark} onClick={onClose} text="Cancel" />
      </div>
    </div>
  </ModalShell>
);
