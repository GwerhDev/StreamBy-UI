import s from './AppSwitcher.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHexagonNodes } from '@fortawesome/free-solid-svg-icons';
import { useDesktop } from '../../../context/DesktopContext';

// Opens Nhexa's apps (the desktop), from the header's right, by the notifications.
export const AppSwitcher = () => {
  const { toggleMinimized } = useDesktop();

  return (
    <button
      type="button"
      className={s.trigger}
      onClick={toggleMinimized}
      title="Nhexa apps"
      aria-label="Nhexa apps"
      data-testid="app-switcher-trigger"
    >
      <FontAwesomeIcon icon={faHexagonNodes} className={s.icon} />
    </button>
  );
};
