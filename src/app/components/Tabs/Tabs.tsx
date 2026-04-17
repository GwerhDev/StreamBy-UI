import s from './Tabs.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { ReactNode, DragEvent } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon: IconDefinition;
  onClose?: () => void;
  draggable?: boolean;
  onDragStart?: (e: DragEvent<HTMLButtonElement>) => void;
}

interface TabsProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  actions?: ReactNode;
  onDrop?: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
}

export const Tabs = ({ tabs, active, onChange, actions, onDrop, onDragOver }: TabsProps) => (
  <div className={s.tabs} onDrop={onDrop} onDragOver={onDragOver}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        type="button"
        className={`${s.tab} ${active === tab.id ? s.active : ''}`}
        onClick={() => onChange(tab.id)}
        draggable={tab.draggable}
        onDragStart={tab.onDragStart}
      >
        <FontAwesomeIcon icon={tab.icon} />
        {tab.label}
        {tab.onClose && (
          <span
            className={s.tabClose}
            role="button"
            tabIndex={-1}
            onClick={e => { e.stopPropagation(); tab.onClose!(); }}
          >
            <FontAwesomeIcon icon={faXmark} />
          </span>
        )}
      </button>
    ))}
    {actions && <div className={s.tabActions}>{actions}</div>}
  </div>
);
