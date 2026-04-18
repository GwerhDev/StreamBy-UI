import s from './SecondaryButton.module.css';
import { Icon } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface SecondaryButtonProps {
  text: string;
  icon?: Icon | any;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: (e: React.FormEvent) => void;
}

export const SecondaryButton = (props: SecondaryButtonProps) => {
  const { text, icon, onClick, type, disabled, ...rest } = props || {};

  const handleOnClick = (e: React.FormEvent) => {
    return onClick && onClick(e);
  };

  return (
    <button className={s.container} onClick={(e) => handleOnClick(e)} disabled={disabled} type={type || "button"}  {...rest} >
      {icon && <FontAwesomeIcon icon={icon} />}
      {text}
    </button>
  )
}
