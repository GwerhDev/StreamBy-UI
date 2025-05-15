import { Outlet } from 'react-router-dom';
import { Browser } from '../components/Browser/Browser';

export default function ProjectLayout() {
  return (
    <Browser>
      <Outlet />
    </Browser >
  );
}
