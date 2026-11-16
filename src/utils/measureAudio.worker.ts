/// <reference lib="webworker" />
import { measureAudio, waveformPeaks, type DecodedAudio } from './measureAudio';

// Measuring a long file takes seconds: done off the page's thread.
self.onmessage = (event: MessageEvent<{ audio: DecodedAudio; file: { bitDepth: number | null; format: string | null }; buckets: number }>) => {
  const { audio, file, buckets } = event.data;
  try {
    self.postMessage({ measurements: measureAudio(audio, file), peaks: waveformPeaks(audio.channels, buckets) });
  } catch (err) {
    self.postMessage({ error: err instanceof Error ? err.message : String(err) });
  }
};
