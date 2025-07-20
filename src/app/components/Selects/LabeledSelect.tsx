import s from "./LabeledSelect.module.css";
import { Database } from "../../../interfaces";

export const LabeledSelect = (props: any) => {
  const { label, name, value, id, htmlFor, onChange, options } = props || {};

  return (
    <span className={s.selectContainer}>
      <label htmlFor={htmlFor}>{label}</label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={s.selectInput}
      >
        {options.map((option: Database, index: number) => (
          <option key={index} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </span>
  );
};
