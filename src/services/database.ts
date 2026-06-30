import { API_BASE } from '../config/api';
import { DbConnection, DbColumnDefinition } from '../interfaces';

export async function fetchBuiltinDatabases(): Promise<{ name: string; value: string }[]> {
  try {
    const res = await fetch(`${API_BASE}/streamby/databases`, { credentials: 'include' });
    if (!res.ok) return [];
    const { databases } = await res.json();
    return databases ?? [];
  } catch {
    return [];
  }
}

const BASE = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}/connections/db`;

export interface DbConnectionPayload {
  name: string;
  dbType: 'postgresql' | 'mongodb';
  credentialId: string;
  description?: string;
}

export interface CreateTablePayload {
  tableName: string;
  columns: DbColumnDefinition[];
}

export async function fetchDbConnections(projectId: string): Promise<DbConnection[]> {
  const res = await fetch(BASE(projectId), { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function createDbConnection(projectId: string, payload: DbConnectionPayload): Promise<DbConnection> {
  const res = await fetch(BASE(projectId), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function deleteDbConnection(projectId: string, connId: string): Promise<void> {
  const res = await fetch(`${BASE(projectId)}/${connId}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function fetchTables(projectId: string, connId: string): Promise<string[]> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables`, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function createTable(projectId: string, connId: string, schema: CreateTablePayload): Promise<void> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schema),
  });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function fetchRecords(
  projectId: string,
  connId: string,
  tableName: string,
  limit = 50,
  offset = 0,
): Promise<any[]> {
  const res = await fetch(
    `${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}?limit=${limit}&offset=${offset}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function insertRecord(
  projectId: string,
  connId: string,
  tableName: string,
  record: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function updateRecord(
  projectId: string,
  connId: string,
  tableName: string,
  recordId: string,
  updates: Record<string, unknown>,
): Promise<any> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const { data } = await res.json();
  return data;
}

export async function deleteTable(projectId: string, connId: string, tableName: string): Promise<void> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message);
}

export async function deleteRecord(
  projectId: string,
  connId: string,
  tableName: string,
  recordId: string,
): Promise<void> {
  const res = await fetch(`${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error((await res.json()).message);
}
