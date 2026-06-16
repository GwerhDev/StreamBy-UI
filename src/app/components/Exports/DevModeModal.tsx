import s from './DevModeModal.module.css';
import { useState, useRef, KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { ModalShell } from '../Modals/ModalShell';

const DEFAULT_PORTS = [3000, 5173, 8080, 4200];

interface DevModeModalProps {
  initialPorts: number[];
  onConfirm: (ports: number[]) => void;
  onClose: () => void;
}

export function DevModeModal({ initialPorts, onConfirm, onClose }: DevModeModalProps) {
  const [ports, setPorts] = useState<number[]>(initialPorts.length ? initialPorts : [...DEFAULT_PORTS]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addPort = (raw: string) => {
    const num = parseInt(raw.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= 65535 && !ports.includes(num)) {
      setPorts(prev => [...prev, num]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addPort(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && ports.length > 0) {
      setPorts(prev => prev.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addPort(inputValue);
  };

  return (
    <ModalShell
      title="Dev Mode"
      icon={faCode}
      onClose={onClose}
      overlayClassName={s.elevated}
      footer={
        <>
          <SecondaryButton icon={faXmark} text="Cancel" onClick={onClose} />
          <ActionButton icon={faCheck} text="Activate" onClick={() => onConfirm(ports)} disabled={ports.length === 0} />
        </>
      }
    >
      <p className={s.description}>
        Localhost requests from these ports will be allowed as CORS origins for all exports while Dev Mode is active.
      </p>
      <div className={s.portTags} onClick={() => inputRef.current?.focus()}>
        {ports.map(port => (
          <span key={port} className={s.portTag}>
            :{port}
            <button
              className={s.removeTag}
              onClick={e => { e.stopPropagation(); setPorts(prev => prev.filter(p => p !== port)); }}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        className={s.portInput}
        type="number"
        min={1}
        max={65535}
        placeholder="Add port (press Enter)"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </ModalShell>
  );
}
