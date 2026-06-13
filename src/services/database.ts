import { API_BASE } from '../config/api';
import { store } from '../store';
import { addApiResponse } from '../store/apiResponsesSlice';
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
  try {
    const res = await fetch(BASE(projectId), { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch DB connections.', type: 'error' }));
    return [];
  }
}

export async function createDbConnection(projectId: string, payload: DbConnectionPayload): Promise<DbConnection | null> {
  try {
    const res = await fetch(BASE(projectId), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    store.dispatch(addApiResponse({ message: 'DB connection created successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create DB connection.', type: 'error' }));
    return null;
  }
}

export async function deleteDbConnection(projectId: string, connId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(projectId)}/${connId}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message);
    store.dispatch(addApiResponse({ message: 'DB connection deleted.', type: 'success' }));
    return true;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to delete DB connection.', type: 'error' }));
    return false;
  }
}

export async function fetchTables(projectId: string, connId: string): Promise<string[]> {
  try {
    const res = await fetch(`${BASE(projectId)}/${connId}/tables`, { credentials: 'include' });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch tables.', type: 'error' }));
    return [];
  }
}

export async function createTable(projectId: string, connId: string, schema: CreateTablePayload): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(projectId)}/${connId}/tables`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schema),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    store.dispatch(addApiResponse({ message: 'Table/collection created successfully.', type: 'success' }));
    return true;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to create table.', type: 'error' }));
    return false;
  }
}

export async function fetchRecords(
  projectId: string,
  connId: string,
  tableName: string,
  limit = 50,
  offset = 0,
): Promise<any[]> {
  try {
    const res = await fetch(
      `${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}?limit=${limit}&offset=${offset}`,
      { credentials: 'include' },
    );
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to fetch records.', type: 'error' }));
    return [];
  }
}

export async function insertRecord(
  projectId: string,
  connId: string,
  tableName: string,
  record: Record<string, unknown>,
): Promise<any | null> {
  try {
    const res = await fetch(`${BASE(projectId)}/${connId}/tables/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error((await res.json()).message);
    const { data } = await res.json();
    store.dispatch(addApiResponse({ message: 'Record inserted successfully.', type: 'success' }));
    return data;
  } catch (error: any) {
    store.dispatch(addApiResponse({ message: error.message || 'Failed to insert record.', type: 'error' }));
    return null;
  }
}
