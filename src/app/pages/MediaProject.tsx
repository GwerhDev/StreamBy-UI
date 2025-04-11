import { useParams } from 'react-router-dom';

export default function MediaProject() {
  const { id } = useParams();
  return <div className="text-center text-white">Media Project ID: {id}</div>;
}
