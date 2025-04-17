import s from "./LabeledInput.module.css";

export const LabeledInput = (props: any) => {
  const { label, type, placeholder, id, htmlFor } = props || {};

  return (
    <span className={s.inputContainer}>
      <label htmlFor={htmlFor}>{label}</label>
      <input type={type} placeholder={placeholder} id={id} />
    </span>
  )
}
