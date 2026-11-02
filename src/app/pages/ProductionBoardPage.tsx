import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ProductionBoard } from '../components/Production/ProductionBoard';

export function ProductionBoardPage() {
  return <ProductionBoard />;
}

// Where Production used to be: links to it, and to a card of it (?shot=<id>), still work.
export function OldProductionRedirect() {
  const { id } = useParams<{ id: string }>();
  const { search, hash, state } = useLocation();
  return <Navigate replace state={state} to={{ pathname: `/project/${id}/dashboard/production`, search, hash }} />;
}
