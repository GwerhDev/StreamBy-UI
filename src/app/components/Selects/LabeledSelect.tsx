import s from "./LabeledSelect.module.css";
import { DropdownInput } from "../Inputs/DropdownInput";

export const LabeledSelect = (props: any) => {
  const { label, value, htmlFor, onChange, options } = props || {};

  const normalized = options?.map((o: any) => ({ value: o.value, label: o.name ?? o.label })) ?? [];

  return (
    <span className={s.container}>
      <label htmlFor={htmlFor}>{label}</label>
      <DropdownInput
        value={value}
        onChange={v => onChange({ target: { value: v } })}
        options={normalized}
      />
    </span>
  );
};
