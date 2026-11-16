import { API_BASE } from '../config/api';

// What a 3D or audio asset's version measures, measured in the browser by the inspector and
// kept with the version, and the project's budgets it's checked against (StreamBy-Package's
// services/assetMeasurements).

export type MeasuredKind = 'model' | 'audio';

export interface MeasuredTexture { name: string | null; width: number; height: number; format: string | null }
export interface MeasuredAnimation { name: string | null; duration: number }

export interface ModelMeasurements {
  kind?: 'model';
  triangles: number;
  vertices: number;
  meshes: number;
  materials: number;
  textures: MeasuredTexture[];
  animations: MeasuredAnimation[];
  measuredAt?: string;
  measuredBy?: string;
  tool?: string | null;
}

// Loudness in LUFS (ITU-R BS.1770), true peak in dBTP, RMS in dBFS, loudness range in LU; a
// level is null for silence.
export interface AudioMeasurements {
  kind: 'audio';
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
  format: string | null;
  integratedLufs: number | null;
  shortTermLufsMax: number | null;
  truePeak: number | null;
  rms: number | null;
  lra: number | null;
  measuredAt?: string;
  measuredBy?: string;
  tool?: string | null;
}

export type Measurements = ModelMeasurements | AudioMeasurements;
export const isAudio = (m: Measurements | null | undefined): m is AudioMeasurements => m?.kind === 'audio';

export interface BudgetProfile {
  id: string;
  name: string;
  // 3D if not set.
  kind?: MeasuredKind;
  maxTriangles?: number;
  maxMaterials?: number;
  maxTextures?: number;
  maxTextureSize?: number;
  textureFormats?: string[];
  maxAnimations?: number;
  targetLufs?: number;
  lufsTolerance?: number;
  maxTruePeak?: number;
  audioFormats?: string[];
  sampleRates?: number[];
}

export const kindOfProfile = (p: BudgetProfile): MeasuredKind => p.kind ?? 'model';

export interface AssetBudgets { profiles: BudgetProfile[]; defaultProfileId: string | null; defaultAudioProfileId?: string | null }

export interface Exceeded {
  metric: 'triangles' | 'materials' | 'textures' | 'textureSize' | 'textureFormat' | 'animations'
    | 'loudness' | 'truePeak' | 'audioFormat' | 'sampleRate';
  limit: number | string[] | number[];
  value: number | string;
  texture?: string | null;
  tolerance?: number;
}

export interface VersionMeasurements {
  assetId: string;
  versionId: string;
  version: number;
  kind?: MeasuredKind;
  measurements: Measurements | null;
  profile: BudgetProfile | null;
  profileId: string | null;
  exceeded: Exceeded[];
}

export interface AssetVersionSummary { versionId: string; version: number; fileName: string | null; createdAt: string; measurements?: Measurements | null }

const errorOf = async (res: Response, fallback: string) => {
  try { return new Error((await res.json()).message || fallback); } catch { return new Error(fallback); }
};
const base = (projectId: string) => `${API_BASE}/streamby/projects/${projectId}`;
const json = (method: string, body: unknown): RequestInit => ({
  method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

export async function getAssetVersions(projectId: string, assetId: string): Promise<AssetVersionSummary[]> {
  const res = await fetch(`${base(projectId)}/assets/${assetId}/versions`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Failed to load the asset's versions");
  return (await res.json()).versions;
}

/** A version's measurements (the latest version's if none is given), checked against its budget. */
export async function getMeasurements(projectId: string, assetId: string, versionId?: string): Promise<VersionMeasurements> {
  const query = versionId ? `?${new URLSearchParams({ versionId })}` : '';
  const res = await fetch(`${base(projectId)}/assets/${assetId}/measurements${query}`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, 'Failed to load the measurements');
  return res.json();
}

/** Keeps what a version measures: answered with what it has over its budget. */
export async function saveMeasurements(projectId: string, assetId: string, versionId: string, measurements: Measurements): Promise<{ exceeded: Exceeded[]; profile: BudgetProfile | null; measurements: Measurements }> {
  const res = await fetch(`${base(projectId)}/assets/${assetId}/versions/${versionId}/measurements`, json('PUT', measurements));
  if (!res.ok) throw await errorOf(res, 'Failed to save the measurements');
  return res.json();
}

export async function getAssetBudgets(projectId: string): Promise<AssetBudgets> {
  const res = await fetch(`${base(projectId)}/asset-budgets`, { credentials: 'include' });
  if (!res.ok) throw await errorOf(res, "Failed to load the project's budgets");
  return (await res.json()).budgets;
}

export async function saveAssetBudgets(projectId: string, budgets: AssetBudgets): Promise<AssetBudgets> {
  const res = await fetch(`${base(projectId)}/asset-budgets`, json('PUT', budgets));
  if (!res.ok) throw await errorOf(res, "Failed to save the project's budgets");
  return (await res.json()).budgets;
}

/** The budget profile an asset is checked against (null: the project's default). */
export async function setBudgetProfile(projectId: string, assetId: string, profileId: string | null): Promise<void> {
  const res = await fetch(`${base(projectId)}/assets/${assetId}/budget-profile`, json('PUT', { profileId }));
  if (!res.ok) throw await errorOf(res, 'Failed to set the budget profile');
}
