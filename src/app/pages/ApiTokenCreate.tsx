import { useParams } from 'react-router-dom';
import { ApiTokenCreate as ApiTokenCreateForm } from '../components/ApiTokens/ApiTokenCreate';

export const ApiTokenCreate = () => {
  const { id } = useParams<{ id: string }>();
  return <ApiTokenCreateForm projectId={id} />;
};
