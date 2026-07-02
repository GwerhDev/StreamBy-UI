import { Start } from '../components/Start/Start';

export const Home = () => {
  return (
    <div className="dashboard-sections">
      <div style={{ flexGrow: 1, minHeight: 0, overflow: 'auto' }}>
        <Start />
      </div>
    </div>
  );
};
