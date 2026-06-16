import s from './ResourceList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import React from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';

interface ResourceItem {
  id: string;
  card: React.ReactNode;
  onClick?: () => void;
  actions?: React.ReactNode;
  title?: string;
}

interface ResourceListProps {
  icon: IconDefinition;
  title: string;
  subtitle: string;
  items: ResourceItem[];
  loading: boolean;
  onAdd: () => void;
  addLabel: string;
  headerAction?: React.ReactNode;
  layout?: 'list' | 'grid';
}

export const ResourceList = ({
  icon,
  title,
  subtitle,
  items,
  loading,
  onAdd,
  addLabel,
  headerAction,
  layout = 'list',
}: ResourceListProps) => {
  const showHeaderAction = !loading && !items.length;

  return (
    <div className={s.container}>
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        action={showHeaderAction
          ? (headerAction ?? <ActionButton icon={faPlus} text={addLabel} onClick={onAdd} />)
          : undefined}
      />
      {loading ? (
        <ul className={layout === 'grid' ? s.grid : s.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : !items.length ? (
        <div className={s.emptyState}>
          <EmptyBackground />
        </div>
      ) : (
        <ul className={layout === 'grid' ? s.grid : s.list}>
          {items.map(item => (
            <li key={item.id} title={item.title} onClick={item.onClick}>
              {item.card}
              {item.actions}
            </li>
          ))}
          <li className={s.addCard} onClick={onAdd}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>{addLabel}</h4>
          </li>
        </ul>
      )}
    </div>
  );
};
