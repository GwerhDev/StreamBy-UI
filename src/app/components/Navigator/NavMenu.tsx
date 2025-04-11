import s from './NavMenu.module.css';
import { Link } from 'react-router-dom';

export const NavMenu = () => {
  return (
    <ul className={s.container}>
      <Link to={"/overview"}>Overview</Link>
      <Link to={"/documentation"}>Docs</Link>
      <Link to={"/pricing"}>Pricing</Link>
    </ul>
  )
}
