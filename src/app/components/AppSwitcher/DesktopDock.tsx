import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faHouse, faUser, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import s from './DesktopDock.module.css';

// Fixed, unlike the apps from StreamBy's catalog: they're there even when it can't be read.
const TOOLS: { id: string; label: string; icon: IconDefinition; url: string }[] = [
  { id: 'home', label: 'Home', icon: faHouse, url: 'https://nhexa.cl' },
  { id: 'account', label: 'Account', icon: faUser, url: 'https://accounts.nhexa.cl' },
];

export const DesktopDock = () => (
  <nav className={s.dock} data-testid="desktop-dock">
    {TOOLS.map(tool => (
      <button
        key={tool.id}
        type="button"
        className={s.tool}
        title={tool.label}
        aria-label={tool.label}
        onClick={() => { window.location.href = tool.url; }}
        data-testid={`dock-${tool.id}`}
      >
        <FontAwesomeIcon icon={tool.icon} />
      </button>
    ))}
    <span className={s.separator} />
    <button type="button" className={s.tool} title="Settings (coming soon)" aria-label="Settings (coming soon)" disabled data-testid="dock-settings">
      <FontAwesomeIcon icon={faGear} />
    </button>
  </nav>
);
