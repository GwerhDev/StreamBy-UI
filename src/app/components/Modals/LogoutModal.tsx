import { useNavigate } from 'react-router-dom';
import s from './LogoutModal.module.css';
import { PrimaryButton } from '../Buttons/PrimaryButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

export const LogoutModal = () => {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('userToken');
    navigate('/'); // reemplaza router.push('/')
  }

  function handleCancelLogout() {
    const logoutModal = document.getElementById('logout-modal') as HTMLDivElement | null;
    if (logoutModal) {
      logoutModal.style.display = 'none';
    }
  }

  return (
    <div className={s.container} id='logout-modal'>
      <form className={s.modalForm} action="">
        <h1>Are you leaving already?</h1>
        <p>Confirm that you want to log out</p>
        <ul>
          <PrimaryButton onClick={handleLogout} text='Logout' type='button' />
          <SecondaryButton onClick={handleCancelLogout} text='Cancel' type='button' />
        </ul>
      </form>
    </div>
  );
};
