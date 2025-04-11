import s from './SecondaryButton.module.css';

export const SecondaryButton = (props: any) => {
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
