import { useNavigate } from 'react-router-dom';
import s from './LogoutModal.module.css';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faRightFromBracket, faXmark } from '@fortawesome/free-solid-svg-icons';
import { fetchLogout } from '../../../services/auth';

export const LogoutModal = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetchLogout().then(() => {
      const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
      if (logoutModal) {
        logoutModal.style.display = 'none';
      }
      navigate('/login');
    });
  };

  const handleCancelLogout = () => {
    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  };

  return (
    <div className={s.container} id='logout-modal'>
      <form className={s.modalForm} action="">
        <h1>Are you leaving already?</h1>
        <p>Confirm that you want to log out</p>
        <ul>
          <PrimaryButton icon={faRightFromBracket} onClick={handleLogout} text='Logout' type='button' />
          <SecondaryButton icon={faXmark} onClick={handleCancelLogout} text='Cancel' type='button' />
        </ul>
      </form>
    </div>
  );
};
