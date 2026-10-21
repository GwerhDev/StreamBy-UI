import { useParams } from 'react-router-dom';
import { ApiTokenManager } from '../components/ApiTokens/ApiTokenManager';

export const ApiTokens = () => {
  const { id } = useParams<{ id: string }>();
  return <ApiTokenManager projectId={id} />;
};
