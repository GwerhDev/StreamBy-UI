// How an export's data refers to one of the project's assets: StreamBy answers it as a signed
// URL of the asset's current version when the export is read. The bucket is private, so a
// direct URL of it would stop working (and a new version would need the export edited).
export const ASSET_REFERENCE_PREFIX = 'streamby://asset/';

export const assetReference = (fileId: string) => `${ASSET_REFERENCE_PREFIX}${fileId}`;
