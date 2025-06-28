import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProjectMembers } from '../../../services/streamby';

interface Member {
  id: string;
  username: string;
  email: string;
  role: string;
}

export function MemberList() {
  const { id: projectId } = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getMembers = async () => {
      if (!projectId) {
        setError("Project ID is missing.");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchProjectMembers(projectId);
        setMembers(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch project members.");
      } finally {
        setLoading(false);
      }
    };

    getMembers();
  }, [projectId]);

  if (loading) {
    return <p>Cargando miembros...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (members.length === 0) {
    return <p>No hay miembros en este proyecto.</p>;
  }

  return (
    <div>
      <h3>Miembros del Proyecto</h3>
      <ul>
        {members.map((member, index) => (
          <li key={index}>
            <strong>{member.username}</strong> ({member.email}) - {member.role}
          </li>
        ))}
      </ul>
    </div>
  );
}