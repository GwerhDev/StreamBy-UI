import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProjectMembers } from '../../../services/streamby';
import { Member } from '../../../interfaces';

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

  return (
    <div>
      <h3>Miembros del Proyecto</h3>
      {
        loading
          ?
          <p>Cargando...</p>
          :
          <>
            <ul>
              {error && <p>Error: {error}</p>}
              {
                !members.length && !error
                  ?
                  <p>No hay miembros en este proyecto.</p>
                  :
                  members.map((member, index) => (
                    <li key={index}>
                      <strong>{member.username}</strong> - {member.role}
                    </li>
                  ))
              }
            </ul>
          </>
      }
    </div>
  );
}