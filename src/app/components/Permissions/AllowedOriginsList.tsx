import s from './AllowedOriginsList.module.css';
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface AllowedOriginsListProps {
  allowedOrigins: string[];
}

export const AllowedOriginsList = ({ allowedOrigins }: AllowedOriginsListProps) => {
  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2 className={s.title}>Allowed Origins</h2>
        <p className={s.subtitle}>Manage your project's allowed origins</p>
      </div>
      {
        allowedOrigins.length === 0
          ? <p>No allowed origins configured.</p>
          : (
            <ul className={s.originGrid}>
              {allowedOrigins.map((origin, index) => (
                <li key={index} className={s.originListItem}>
                  <span className={s.originIconContainer}>
                    <FontAwesomeIcon icon={faGlobe} />
                  </span>
                  <h4 className={s.originText}>
                    {origin}
                  </h4>
                </li>
              ))}
            </ul>
          )
      }
    </div>
  );
};
