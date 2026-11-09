import { StorageCategory, Worker } from '../../../interfaces';

// StreamBy's own worker (the built-in `streamby`): what each of its kinds takes, and asks for.
export const LOCAL_WORKER_ID = 'streamby';
export const LOCAL_KIND_CATEGORIES: Record<string, StorageCategory[]> = {
  thumbnail: ['images', 'videos'],
  transcode: ['videos', 'audios'],
  lod: ['3d-models'],
  'gltf-convert': ['3d-models'],
  transcribe: ['videos', 'audios'],
};

export const isLocalWorker = (worker: Pick<Worker, 'source' | 'id'> | undefined | null) =>
  worker?.source === 'builtin' && worker.id === LOCAL_WORKER_ID;

/** What a worker can do with an asset of a category: StreamBy's own, only the kinds that take it. */
export const kindsFor = (worker: Worker | undefined, category?: StorageCategory): string[] =>
  !worker ? [] : isLocalWorker(worker) && category
    ? worker.kinds.filter(k => !LOCAL_KIND_CATEGORIES[k] || LOCAL_KIND_CATEGORIES[k].includes(category))
    : worker.kinds;

/** A profile without the options left empty. */
export const cleanProfile = (profile: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(profile).filter(([, v]) => v !== '' && v !== undefined && v !== null));
