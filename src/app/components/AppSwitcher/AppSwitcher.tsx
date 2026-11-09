import s from './AppSwitcher.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHexagonNodes } from '@fortawesome/free-solid-svg-icons';
import { useDesktop } from '../../../context/DesktopContext';
import streambyIcon from '../../../assets/streamby-icon.svg';

// The header's top-left icon: opens Nhexa's apps (the desktop). StreamBy's own icon, which
// turns into the apps icon (hexagon nodes) on hover.
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
      <img src={streambyIcon} alt="" className={s.streambyIcon} />
      <FontAwesomeIcon icon={faHexagonNodes} className={s.appsIcon} />
    </button>
  );
};
