import { useNavigate } from 'react-router-dom';
import s from './LogoutModal.module.css';
import { fetchLogout } from '../../../services/auth';
import { useDispatch } from 'react-redux';
import { clearSession } from '../../../store/sessionSlice';
import { LogoutForm } from '../Forms/LogoutForm';

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
      <LogoutForm handleLogout={handleLogout} handleCancelLogout={handleCancelLogout} />
    </div>
  );
};
