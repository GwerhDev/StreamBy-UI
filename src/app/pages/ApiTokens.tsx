import { useParams } from 'react-router-dom';
import { ApiTokenList } from '../components/ApiTokens/ApiTokenList';

export const ApiTokens = () => {
  const { id } = useParams<{ id: string }>();
  return <ApiTokenList projectId={id} />;
};
