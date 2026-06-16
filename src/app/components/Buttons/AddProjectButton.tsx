import s from './AddProjectButton.module.css';
import addIcon from '../../../assets/add-icon.svg';

interface AddProjectButtonProps {
  onClick?: () => void;
}

export const AddProjectButton = (props: AddProjectButtonProps) => {
  const { onClick } = props || {};

  const handleOnClick = () => {
    return onClick && onClick();
  };

  return (
    <button title="Add project" onClick={handleOnClick} className={s.container}>
      <img src={addIcon} alt="" width={40} />
    </button>
  )
}