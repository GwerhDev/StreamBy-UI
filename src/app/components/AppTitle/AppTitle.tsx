import s from './AppTitle.module.css';

interface AppTitleProps {
  // The project open now, if any: shown instead of StreamBy, which it turns into on hover.
  projectName?: string;
  projectImage?: string;
  onClick: () => void;
}

// The header's centered title, as Nhexa's other apps have it: it goes to StreamBy's home.
export const AppTitle = ({ projectName, projectImage, onClick }: AppTitleProps) => (
  <button type="button" className={s.title} onClick={onClick} data-testid="app-title">
    {projectName ? (
      <>
        <span className={s.project} data-testid="app-title-project">
          {projectImage && <img src={projectImage} alt="" className={s.projectImage} />}
          {projectName.toUpperCase()}
        </span>
        <span className={s.brand} data-testid="app-title-brand">STREAMBY</span>
      </>
    ) : (
      <span data-testid="app-title-brand">STREAMBY</span>
    )}
  </button>
);
