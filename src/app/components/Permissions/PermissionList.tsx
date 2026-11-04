import s from './PermissionList.module.css';
import { ReactNode } from 'react';

// A list of permissions, each a row: what it's about, and what's set for it.
export function PermissionList({ label, children }: { label: string; children: ReactNode }) {
  return <ul className={s.list} aria-label={label}>{children}</ul>;
}

interface RowProps {
  // What it's on (Documents), what it is (Delete documents) and a note on it, if any.
  area?: string;
  label: string;
  hint?: string;
  // What's set for it: a dropdown, a checkbox, or its value as text.
  control: ReactNode;
  // The control's id, when it's an input: the row's label is its label.
  controlId?: string;
}

export function PermissionRow({ area, label, hint, control, controlId }: RowProps) {
  const text = <>{label}{hint && <small className={s.hint}>{hint}</small>}</>;
  return (
    <li className={s.row}>
      <span className={s.what}>
        {area && <span className={s.area}>{area}</span>}
        {controlId
          ? <label htmlFor={controlId} className={s.label}>{text}</label>
          : <span className={s.label}>{text}</span>}
      </span>
      <span className={s.control}>{control}</span>
    </li>
  );
}
