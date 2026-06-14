import s from './Modal.module.css';
import { ReactNode } from 'react';

export const Modal = ({ id, children }: { id: string; children: ReactNode }) => (
  <div className={s.overlay} id={id}>
    {children}
  </div>
);
