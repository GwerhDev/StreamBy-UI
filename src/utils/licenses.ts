import { LicenseMetadata } from '../interfaces';

export const EMPTY_LICENSE: LicenseMetadata = { sourceUrl: null, creatorName: null, creatorUrl: null, licenseType: null, comments: null };

const isHttpUrl = (value: string) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};

/** What the server would refuse of it, told before it's sent: a link that isn't one. */
export function licenseError(values: Partial<LicenseMetadata>): string | null {
  for (const [field, label] of [['sourceUrl', 'Source link'], ['creatorUrl', 'Creator link']] as const) {
    const value = values[field]?.trim();
    if (value && !isHttpUrl(value)) return `${label} must be an http(s) URL.`;
  }
  return null;
}
