import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import s from './ActionButton.module.css';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ActionButtonProps {
  text?: string;
  onClick?: () => void;
  icon?: IconDefinition;
  disabled?: boolean;
  href?: string;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}

export const ActionButton = (props: ActionButtonProps) => {
  const { text, onClick, icon, disabled, href, isLoading, type, form } = props || {};

  const handleOnClick = () => {
    return onClick && onClick();
  };

  return (
    <>
      {
        href
          ?
          <a href={href} className={s.container} onClick={handleOnClick}>
            {
              isLoading
                ?
                <FontAwesomeIcon icon={faSpinner} spin />
                :
                <>
                  {icon && <FontAwesomeIcon icon={icon} />}
                  {text}
                </>
            }
          </a>
          :
          <button disabled={disabled} className={s.container} onClick={handleOnClick} type={type} form={form}>
            {
              isLoading
                ?
                <FontAwesomeIcon icon={faSpinner} spin />
                :
                <>
                  {icon && <FontAwesomeIcon icon={icon} />}
                  {text}
                </>
            }
          </button>
      }
    </>
  )
}
