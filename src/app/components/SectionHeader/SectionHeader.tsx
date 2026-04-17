import s from './SectionHeader.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
}

export function SectionHeader({ icon, title, subtitle, badge, action }: SectionHeaderProps) {
  return (
    <div className={s.header}>
      <span className={s.iconWrap}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className={s.headerText}>
        <h2 className={s.title}>{title}</h2>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {badge && <span className={s.badge}>{badge}</span>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
