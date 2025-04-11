import s from './AddProjectButton.module.css';
import addIcon from '../../../assets/add-icon.svg';

export const AddProjectButton = (props: any) => {
  const { onClick } = props || null;

  function handleOnClick() {
    console.log("create project");
    onClick && onClick();
  }

  return (
    <button onClick={handleOnClick} className={s.container}>
      <img src={addIcon} alt="" width={40} />
    </button>
  )
}