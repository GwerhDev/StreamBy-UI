import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProjectMembers } from '../../../services/projects';
import { Member } from '../../../interfaces';
import { MemberCard } from '../Cards/MemberCard';
import s from './MemberList.module.css';
import skeleton from '../Loader/Skeleton.module.css';

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
    <div className={s.container}>
      <div className={s.header}>
        <h2 className={s.title}>Project Members</h2>
        <p className={s.subtitle}>Manage your project's team</p>
      </div>
      {
        loading
          ?
          <ul className={s.memberGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <li key={index} className={`${s.memberListItem} ${skeleton.skeleton}`}></li>
            ))}
          </ul>
          :
          <>
            <ul className={s.memberGrid}>
              {error && <p>Error: {error}</p>}
              {
                !members.length && !error
                  ?
                  <p>No members in this project.</p>
                  :
                  members.map((member, index) => (
                    <li key={index} className={s.memberListItem}>
                      <MemberCard member={member} />
                    </li>
                  ))
              }
            </ul>
          </>
      }
    </div>
  );
}