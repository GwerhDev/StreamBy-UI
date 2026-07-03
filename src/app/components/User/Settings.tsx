import s from './Settings.module.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import {
  faUser, faPalette, faBell, faCode, faShield, faCreditCard,
  faChevronRight, faLock, faEnvelope, faTrash, faMoon,
  faGlobe, faCompress, faSlidersH, faIndent, faObjectGroup,
  faMap, faAt, faMobile, faLink, faHashtag, faKey,
  faFingerprint, faTerminal, faBuilding, faChartBar, faUsers, faRocket,
  faGear,
} from '@fortawesome/free-solid-svg-icons';

type CategoryId = 'account' | 'appearance' | 'notifications' | 'editor' | 'security' | 'billing';

interface SettingItem {
  icon: typeof faUser;
  label: string;
  description: string;
  soon?: boolean;
  href?: string;
}

interface Category {
  id: CategoryId;
  label: string;
  icon: typeof faUser;
  items: SettingItem[];
}

const SoonBadge = () => <span className={s.soonBadge}>Soon</span>;

const buildCategories = (): Category[] => [
  {
    id: 'account', label: 'Account', icon: faUser,
    items: [
      { icon: faEnvelope, label: 'Email address',  description: 'Change or verify your email address', soon: true },
      { icon: faLock,     label: 'Password',       description: 'Update your login password', soon: true },
      { icon: faTrash,    label: 'Delete account', description: 'Permanently delete your account and all data', soon: true },
    ],
  },
  {
    id: 'appearance', label: 'Appearance', icon: faPalette,
    items: [
      { icon: faMoon,     label: 'Color theme',   description: 'Switch between dark, light and system theme', soon: true },
      { icon: faGlobe,    label: 'Language',      description: 'Choose the interface display language', soon: true },
      { icon: faCompress, label: 'Compact mode',  description: 'Reduce spacing across the UI for denser layouts', soon: true },
      { icon: faSlidersH, label: 'Accessibility', description: 'Motion, contrast, and font size preferences', soon: true },
    ],
  },
  {
    id: 'notifications', label: 'Notifications', icon: faBell,
    items: [
      { icon: faAt,      label: 'Email digest',          description: 'Receive a summary of activity via email', soon: true },
      { icon: faMobile,  label: 'Browser notifications', description: 'Enable push notifications in the browser', soon: true },
      { icon: faLink,    label: 'Webhook events',        description: 'Send project events to an external URL', soon: true },
      { icon: faHashtag, label: 'Slack integration',     description: 'Forward notifications to a Slack channel', soon: true },
    ],
  },
  {
    id: 'editor', label: 'Editor', icon: faCode,
    items: [
      { icon: faIndent,      label: 'Default JSON indent', description: 'Set the default indentation for the JSON editor', soon: true },
      { icon: faObjectGroup, label: 'Node grid snap',      description: 'Snap nodes to a grid while dragging in the canvas', soon: true },
      { icon: faMap,         label: 'Minimap',             description: 'Show a minimap overlay in the node editor', soon: true },
      { icon: faTerminal,    label: 'Auto-save interval',  description: 'Automatically save export changes every N seconds', soon: true },
    ],
  },
  {
    id: 'security', label: 'Security', icon: faShield,
    items: [
      { icon: faFingerprint, label: 'Two-factor auth',     description: 'Add an extra layer of security to your account', soon: true },
      { icon: faKey,         label: 'Personal API tokens', description: 'Generate tokens to access the Streamby API', soon: true },
      { icon: faBuilding,    label: 'Active sessions',     description: 'View and revoke active login sessions', soon: true },
      { icon: faTerminal,    label: 'OAuth applications',  description: 'Manage third-party apps with access to your account', soon: true },
    ],
  },
  {
    id: 'billing', label: 'Plan & Billing', icon: faCreditCard,
    items: [
      { icon: faRocket,     label: 'Current plan',   description: 'View your active plan and included features', soon: true },
      { icon: faChartBar,   label: 'Usage',          description: 'Storage, requests, and bandwidth consumption', soon: true },
      { icon: faUsers,      label: 'Seat management', description: 'Manage members and seats across your organization', soon: true },
      { icon: faCreditCard, label: 'Billing info',   description: 'Payment methods and invoice history', soon: true },
    ],
  },
];

export const Settings = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') as CategoryId | null;

  const categories = buildCategories();

  if (!activeTab) {
    return (
      <div className={s.page}>
        <SectionHeader icon={faGear} title="Settings" />
        <ul className={s.itemList}>
          {categories.map(cat => (
            <li key={cat.id} className={s.item} onClick={() => navigate(`/user/settings?tab=${cat.id}`)}>
              <span className={s.itemIconWrap}><FontAwesomeIcon icon={cat.icon} /></span>
              <span className={s.itemText}>
                <span className={s.itemLabel}>{cat.label}</span>
              </span>
              <FontAwesomeIcon icon={faChevronRight} className={s.itemArrow} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const current = categories.find(c => c.id === activeTab) ?? categories[0];

  return (
    <div className={s.page}>
      <SectionHeader icon={current.icon} title={current.label} />

      <ul className={s.itemList}>
        {current.items.map(item => {
          const inner = (
            <>
              <span className={s.itemIconWrap}>
                <FontAwesomeIcon icon={item.icon} />
              </span>
              <span className={s.itemText}>
                <span className={s.itemLabel}>
                  {item.label}
                  {item.soon && <SoonBadge />}
                </span>
                <span className={s.itemDescription}>{item.description}</span>
              </span>
              {!item.soon && <FontAwesomeIcon icon={faChevronRight} className={s.itemArrow} />}
            </>
          );

          if (item.soon) return (
            <li key={item.label} className={`${s.item} ${s.itemDisabled}`}>{inner}</li>
          );

          if (item.href) return (
            <li key={item.label} className={s.item}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className={s.itemLink}>{inner}</a>
            </li>
          );

          return <li key={item.label} className={s.item}>{inner}</li>;
        })}
      </ul>

    </div>
  );
};
