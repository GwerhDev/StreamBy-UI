import React from 'react';
import s from './CustomCheckbox.module.css';

interface CustomCheckboxProps {
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  value?: string;
  disabled?: boolean;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  value,
  disabled,
}) => {
  return (
    <label htmlFor={id} className={s.checkboxContainer}>
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={s.input}
      />
      <span className={s.label}>{label}</span>
    </label>
  );
};