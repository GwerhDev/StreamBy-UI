import s from './LogoutModal.module.css';
import { fetchLogout } from '../../../services/auth';
import { useDispatch } from 'react-redux';
import { clearSession, setLoader } from '../../../store/sessionSlice';
import { LogoutForm } from '../Forms/LogoutForm';

export const LogoutModal = () => {
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await fetchLogout(setLoader).then(() => {
      const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
      if (logoutModal) logoutModal.style.display = 'none';
    }).finally(() => {
      dispatch(clearSession());
      window.location.href = '/login';
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
      <LogoutForm handleLogout={handleLogout} handleCancelLogout={handleCancelLogout} />
    </div>
  );
};
