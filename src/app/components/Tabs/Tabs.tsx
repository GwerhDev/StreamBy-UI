import s from './Tabs.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface TabItem {
  id: string;
  label: string;
  icon: IconDefinition;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export const Tabs = ({ tabs, active, onChange }: TabsProps) => (
  <div className={s.tabs}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        type="button"
        className={`${s.tab} ${active === tab.id ? s.active : ''}`}
        onClick={() => onChange(tab.id)}
      >
        <FontAwesomeIcon icon={tab.icon} />
        {tab.label}
      </button>
    ))}
  </div>
);
