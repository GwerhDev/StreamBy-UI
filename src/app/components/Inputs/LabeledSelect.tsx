import React from 'react';
import s from './LabeledInput.module.css';

interface LabeledSelectProps {
  label: string;
  name: string;
  value: string;
  id: string;
  htmlFor: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function LabeledSelect({
  label,
  name,
  value,
  id,
  htmlFor,
  onChange,
  options,
  disabled = false,
}: LabeledSelectProps) {
  return (
    <div className={s.inputContainer}>
      <label htmlFor={htmlFor}>{label}</label>
      <select
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
