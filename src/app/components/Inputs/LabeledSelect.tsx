import React from 'react';
import s from './LabeledSelect.module.css';
import { DropdownInput } from './DropdownInput';

interface LabeledSelectProps {
  label: string;
  name?: string;
  value: string;
  id?: string;
  htmlFor?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function LabeledSelect({ label, htmlFor, value, onChange, options, disabled = false }: LabeledSelectProps) {
  return (
    <div className={s.container}>
      <label htmlFor={htmlFor}>{label}</label>
      <DropdownInput
        value={value}
        onChange={v => onChange({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
        options={options}
        disabled={disabled}
      />
    </div>
  );
}
