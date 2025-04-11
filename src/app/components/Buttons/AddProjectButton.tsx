import s from './AddProjectButton.module.css';

export const AddProjectButton = (props: any) => {
  const { onClick } = props || null;

  function handleOnClick() {
    console.log("create project");
    onClick && onClick();
  }

  return (
    <button onClick={handleOnClick} className={s.container}>
      <img src="add-icon.svg" alt="" width={40} />
    </button>
  )
}