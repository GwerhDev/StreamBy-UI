import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import s from './ActionButton.module.css';

export const ActionButton = (props: any) => {
  const { text, onClick, icon, disabled } = props || {};

  const handleOnClick = () => {
    return onClick && onClick();
  };

  return (
    <button disabled={disabled} className={s.container} onClick={handleOnClick}>
      {icon && <FontAwesomeIcon icon={icon} />}
      {text}
    </button>
  )
}
