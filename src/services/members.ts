import { API_BASE } from "../config/api";

type MemberRole = 'viewer' | 'editor' | 'admin';

export async function inviteMember(projectId: string, userId: string, role: MemberRole) {
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
  return data.member;
}

export async function updateMemberRole(projectId: string, userId: string, role: MemberRole) {
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
  return res.json();
}

export async function removeMember(projectId: string, userId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to remove member');
  }
  return res.json();
}

export async function acceptInvitation(projectId: string, userId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}/accept`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to accept invitation');
  }
  return res.json();
}

export async function rejectInvitation(projectId: string, userId: string) {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/members/${userId}/reject`, {
    method: 'PATCH',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to reject invitation');
  }
  return res.json();
}
