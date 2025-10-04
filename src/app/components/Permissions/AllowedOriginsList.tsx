import s from './AllowedOriginsList.module.css';

interface AllowedOriginsListProps {
  allowedOrigins: string[];
}

export const AllowedOriginsList = ({ allowedOrigins }: AllowedOriginsListProps) => {
  return (
    <div className={s.container}>
      <h3>Allowed Origins</h3>
      {
        allowedOrigins.length === 0
          ? <p>No allowed origins configured.</p>
          : (
            <div className={s.originsGrid}>
              {allowedOrigins.map((origin, index) => (
                <div key={index} className={s.originCard}>
                  {origin}
                </div>
              ))}
            </div>
          )
      }
    </div>
  );
};
