import { useEffect, useState } from 'react';
import { fetchProjectMembers } from '../services/projects';
import { Member } from '../interfaces';

// A project's active members (who can be assigned work), and a name for any user id.
export function useProjectMembers(projectId: string) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchProjectMembers(projectId)
      .then((list: Member[]) => { if (!cancelled) setMembers(list.filter(m => m.status === 'active')); })
      .catch(() => { if (!cancelled) setMembers([]); });
    return () => { cancelled = true; };
  }, [projectId]);

  const nameOf = (userId: string) => members.find(m => m.userId === userId)?.username ?? 'Former member';
  return { members, nameOf };
}
