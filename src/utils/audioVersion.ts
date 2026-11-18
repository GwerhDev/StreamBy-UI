import type { AssetVersionSummary } from '../services/assetMeasurements';

const AUDIO_FILE = /\.(wav|wave|mp3|flac|ogg|oga|opus|m4a|aac|aiff?)$/i;

/** Whether a version is audio: by its type, its file's name, or what it was measured as. */
export const isAudioVersion = (version: AssetVersionSummary | undefined) =>
  !!version && (
    !!version.contentType?.startsWith('audio/')
    || AUDIO_FILE.test(version.fileName ?? '')
    || (version.measurements as { kind?: string } | null | undefined)?.kind === 'audio'
  );
