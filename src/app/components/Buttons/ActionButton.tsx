import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import s from './ActionButton.module.css';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export const ActionButton = (props: any) => {
  const { text, onClick, icon, disabled, href, isLoading } = props || {};

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
          <button disabled={disabled} className={s.container} onClick={handleOnClick}>
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
