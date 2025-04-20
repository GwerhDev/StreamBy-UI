import { useNavigate } from 'react-router-dom';
import s from './LogoutModal.module.css';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { faRightFromBracket, faXmark } from '@fortawesome/free-solid-svg-icons';
import { fetchLogout } from '../../../services/auth';
import { useDispatch } from 'react-redux';
import { clearSession } from '../../../store/sessionSlice';

export const LogoutModal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await fetchLogout()
    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    if (logoutModal) logoutModal.style.display = 'none';
    dispatch(clearSession());
    navigate('/login');
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
        <h2>Are you leaving already?</h2>
        <p>Confirm that you want to log out</p>
        <ul className={s.buttonContainer}>
          <PrimaryButton icon={faRightFromBracket} onClick={handleLogout} text='Logout' type='button' />
          <SecondaryButton icon={faXmark} onClick={handleCancelLogout} text='Cancel' type='button' />
        </ul>
      </form>
    </div>
  );
};
