import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

export interface UserSearchResult {
  id: string;
  username: string;
  profilePic?: string;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  try {
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
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to search users.', type: 'error' }));
    return [];
  }
}
