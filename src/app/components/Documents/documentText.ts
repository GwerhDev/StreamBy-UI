import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { DocumentAuthor } from '../../../interfaces';

/** Who saved a version, as people read it: "Claude on behalf of ada", "agent (API token)". */
export const authorLabel = (author: DocumentAuthor) => {
  if (author.via === 'oauth') return `${author.clientName || 'An app'} on behalf of ${author.username}`;
  if (author.via === 'apiToken') return `${author.username} (API token)`;
  return author.username;
};

export const dateLabel = (date: string) => new Date(date).toLocaleString();

/** What the signed-in member may do with the project's documents: editors and admins change them. */
export function useDocumentsRole() {
  const userId = useSelector((state: RootState) => state.session.userId);
  const role = useSelector((state: RootState) => state.currentProject.data?.members?.find(m => m.userId === userId)?.role);
  return { canEdit: role === 'editor' || role === 'admin' };
}
