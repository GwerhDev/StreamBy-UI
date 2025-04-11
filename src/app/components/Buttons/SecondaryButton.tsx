import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import s from './SecondaryButton.module.css';

export const SecondaryButton = (props: any) => {
  const { text, icon, onClick, type } = props || {};

  const handleOnClick = () => {
    return onClick && onClick();
  };

  return (
    <button className={s.container} onClick={handleOnClick} type={type || "button"} >
      {icon && <FontAwesomeIcon icon={icon} />}
      {text}
    </button>
  )
}
