import s from './LogoutModal.module.css';
import { fetchLogout } from '../../../services/auth';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { clearSession } from '../../../store/sessionSlice';
import { LogoutForm } from '../Forms/LogoutForm';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { ModalShell } from './ModalShell';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faRightFromBracket, faXmark } from '@fortawesome/free-solid-svg-icons';

export const LogoutModal = () => {
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    try {
      await fetchLogout();
      dispatch(addApiResponse({ message: 'Logged out successfully.', type: 'success' }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to log out.';
      dispatch(addApiResponse({ message, type: 'error' }));
    } finally {
      handleCancelLogout();
      dispatch(clearSession());
    }
  };

  const handleCancelLogout = () => {
    const modal = document.getElementById('logout-modal') as HTMLDivElement | null;
    if (modal) modal.style.display = 'none';
  };

  return (
    <div className={s.container} id="logout-modal">
      <ModalShell
        title="Are you leaving already?"
        onClose={handleCancelLogout}
        footer={
          <>
            <SecondaryButton icon={faXmark} onClick={handleCancelLogout} text="Cancel" />
            <PrimaryButton icon={faRightFromBracket} onClick={handleLogout} text="Logout" />
          </>
        }
      >
        <LogoutForm />
      </ModalShell>
    </div>
  );
};
