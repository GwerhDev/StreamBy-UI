import s from './ProjectButton.module.css';

export const ProjectButton = (props: any) => {
  const { action, project } = props || null;

  function handleOnClick() {
    action(project);
    console.log(project);
  }

  return (
    <button onClick={handleOnClick} className={s.container}>
      <img src={project?.img || "default-img.png"} alt="" width={"100%"} />
    </button>
  )
}
