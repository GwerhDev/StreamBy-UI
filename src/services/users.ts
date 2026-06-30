import { API_BASE } from "../config/api";

export interface UserSearchResult {
  id: string;
  username: string;
  profilePic?: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const res = await fetch(`${API_BASE}/streamby/users/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to search users');
  }
  const { users } = await res.json();
  return users;
}
