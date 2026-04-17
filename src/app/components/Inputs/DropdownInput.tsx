import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import s from './DropdownInput.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownInputProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  disabled?: boolean;
  placeholder?: string;
  dropdownMinWidth?: number;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export function DropdownInput({ value, onChange, options, disabled, placeholder, dropdownMinWidth }: DropdownInputProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find(o => o.value === value);

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div className={s.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        className={`${s.trigger} ${open ? s.triggerOpen : ''}`}
        onClick={openDropdown}
        disabled={disabled}
      >
        <span className={s.label}>{selected?.label ?? placeholder ?? '—'}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`${s.chevron} ${open ? s.chevronOpen : ''}`} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <ul
          className={s.dropdown}
          style={{ top: pos.top, left: pos.left, width: dropdownMinWidth ? Math.max(pos.width, dropdownMinWidth) : pos.width }}
        >
          {options.map(opt => (
            <li
              key={opt.value}
              className={`${s.option} ${opt.value === value ? s.optionActive : ''}`}
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
