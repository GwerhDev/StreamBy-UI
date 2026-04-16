import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';

type MemberRole = 'viewer' | 'editor' | 'admin';

export async function inviteMember(projectId: string, userId: string, role: MemberRole) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to invite member');
    }

    const data = await res.json();
    store.dispatch(addApiResponse({ message: data.message || 'Member invited successfully.', type: 'success' }));
    return data.member;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to invite member.', type: 'error' }));
    throw error;
  }
}

export async function updateMemberRole(projectId: string, userId: string, role: MemberRole) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to update member role');
    }

    const data = await res.json();
    store.dispatch(addApiResponse({ message: data.message || 'Member role updated.', type: 'success' }));
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to update member role.', type: 'error' }));
    throw error;
  }
}

export async function removeMember(projectId: string, userId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to remove member');
    }

    const data = await res.json();
    store.dispatch(addApiResponse({ message: data.message || 'Member removed.', type: 'success' }));
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to remove member.', type: 'error' }));
    throw error;
  }
}
