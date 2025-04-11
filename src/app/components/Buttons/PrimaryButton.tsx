import s from './PrimaryButton.module.css';

export const PrimaryButton = (props: any) => {
  const { text, onClick, type } = props || null;

  function handleOnClick() {
    onClick && onClick();
  }

  return (
    <button className={s.container} onClick={handleOnClick} type={type || "button"} >
      {text}
    </button>
  )
}
