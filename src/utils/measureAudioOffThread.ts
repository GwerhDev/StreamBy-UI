import type { AudioMeasurements } from '../services/assetMeasurements';
import type { AudioFile } from './audioFile';
import { measureAudio, waveformPeaks } from './measureAudio';

export interface MeasuredAudio { measurements: AudioMeasurements; peaks: { min: number; max: number }[] }

/** A decoded file's measurements and waveform, worked out in a worker (here, where there's none). */
export function measureAudioOffThread({ audio, bitDepth, format }: AudioFile, buckets = 800): Promise<MeasuredAudio> {
  const file = { bitDepth, format };
  if (typeof Worker === 'undefined') {
    return Promise.resolve({ measurements: measureAudio(audio, file), peaks: waveformPeaks(audio.channels, buckets) });
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./measureAudio.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<MeasuredAudio & { error?: string }>) => {
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = event => { worker.terminate(); reject(new Error(event.message || "Couldn't measure the audio")); };
    worker.postMessage({ audio, file, buckets });
  });
}
