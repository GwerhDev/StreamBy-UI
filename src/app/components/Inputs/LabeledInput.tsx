import s from "./LabeledInput.module.css";
import { LabeledInputProps } from '../../../interfaces';

export const LabeledInput = (props: LabeledInputProps) => {
  const { label, name, value, type, placeholder, id, htmlFor, onChange } = props;

  return (
    <span className={s.inputContainer}>
      <label htmlFor={htmlFor}>{label}</label>
      <input type={type} name={name} placeholder={placeholder} id={id} onChange={onChange} value={value} />
    </span>
  )
}