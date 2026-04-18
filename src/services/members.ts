import { API_BASE } from "../config/api";
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
import { setCurrentProject } from '../store/currentProjectSlice';

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

export async function acceptInvitation(projectId: string, userId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}/accept`, {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to accept invitation');
    }

    const data = await res.json();
    store.dispatch(addApiResponse({ message: data.message || 'Invitation accepted.', type: 'success' }));

    const state = store.getState();
    const current = state.currentProject.data;
    if (current?.id === projectId) {
      store.dispatch(setCurrentProject({
        ...current,
        members: current.members?.map(m =>
          m.userId === userId ? { ...m, status: 'active' } : m
        ) ?? [],
      }));
    }

    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to accept invitation.', type: 'error' }));
    throw error;
  }
}

export async function rejectInvitation(projectId: string, userId: string) {
  try {
    const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}/reject`, {
      method: 'PATCH',
      credentials: 'include',
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to reject invitation');
    }

    const data = await res.json();
    store.dispatch(addApiResponse({ message: data.message || 'Invitation rejected.', type: 'success' }));

    const state = store.getState();
    const current = state.currentProject.data;
    if (current?.id === projectId) {
      store.dispatch(setCurrentProject({
        ...current,
        members: current.members?.filter(m => m.userId !== userId) ?? [],
      }));
    }

    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to reject invitation.', type: 'error' }));
    throw error;
  }
}
