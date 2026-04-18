import { Outlet } from 'react-router-dom';
import { NotificationMenu } from '../components/Notifications/NotificationMenu';
import { Browser } from '../components/Browser/Browser';

export default function NotificationLayout() {
  return (
    <div className="dashboard-sections">
      <NotificationMenu />
      <Browser env="notification">
        <Outlet />
      </Browser>
    </div>
  );
}
