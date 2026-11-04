import s from './Accordion.module.css';
import { ReactNode, useId, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface Props {
  icon: IconDefinition;
  title: string;
  description?: string;
  // Open when it's first shown (default), or closed.
  defaultOpen?: boolean;
  children: ReactNode;
}

// A section that opens and closes from its head: an icon, a title and what it's about, and a
// chevron that points down while it's open. Looks like a settings item (see User/Settings).
export function Accordion({ icon, title, description, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  return (
    <section className={`${s.accordion} ${open ? s.open : ''}`}>
      <button type="button" className={s.head} aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen(o => !o)}>
        <span className={s.iconWrap}><FontAwesomeIcon icon={icon} /></span>
        <span className={s.text}>
          <span className={s.title}>{title}</span>
          {description && <span className={s.description}>{description}</span>}
        </span>
        <FontAwesomeIcon icon={faChevronRight} className={s.chevron} />
      </button>
      {open && <div id={bodyId} className={s.body}>{children}</div>}
    </section>
  );
}
