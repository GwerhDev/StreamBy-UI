import s from "./LabeledInput.module.css";

export const LabeledInput = (props: any) => {
  const { label, name, value, type, placeholder, id, htmlFor, onChange } = props;

  return (
    <span className={s.inputContainer}>
      <label htmlFor={htmlFor}>{label}</label>
      <input type={type} name={name} placeholder={placeholder} id={id} onChange={onChange} value={value} />
    </span>
  )
}
