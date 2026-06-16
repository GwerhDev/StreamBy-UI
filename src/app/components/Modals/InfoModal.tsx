import React from 'react';
import { ModalShell } from './ModalShell';

interface InfoModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ title, onClose, children }) => (
  <ModalShell title={title} onClose={onClose}>
    {children}
  </ModalShell>
);
