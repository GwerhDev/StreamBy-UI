import type { DecodedAudio } from './measureAudio';
import { wavBitDepth } from './measureAudio';

// An audio file as the inspector reads it: decoded at its own sample rate (the browser decodes at
// its context's rate, resampling what isn't), which is read from its header first.

const ascii = (view: DataView, at: number, length: number) =>
  at + length <= view.byteLength ? String.fromCharCode(...Array.from({ length }, (_, i) => view.getUint8(at + i))) : '';

const MP3_RATES: Record<number, number[]> = { 3: [44_100, 48_000, 32_000], 2: [22_050, 24_000, 16_000], 0: [11_025, 12_000, 8_000] };

/** A file's sample rate, from its header: a WAV's, FLAC's, Ogg Vorbis' or Opus' (its input rate), or an MP3's; null if unknown. */
export function headerSampleRate(bytes: ArrayBuffer): number | null {
  const view = new DataView(bytes);
  if (ascii(view, 0, 4) === 'RIFF' && ascii(view, 8, 4) === 'WAVE') {
    for (let at = 12; at + 8 <= view.byteLength;) {
      const size = view.getUint32(at + 4, true);
      if (ascii(view, at, 4) === 'fmt ' && at + 16 <= view.byteLength) return view.getUint32(at + 12, true) || null;
      at += 8 + size + (size % 2);
    }
    return null;
  }
  if (ascii(view, 0, 4) === 'fLaC' && view.byteLength >= 21) {
    // STREAMINFO, first: 20 bits of rate 10 bytes into it.
    return ((view.getUint8(18) << 12) | (view.getUint8(19) << 4) | (view.getUint8(20) >> 4)) || null;
  }
  if (ascii(view, 0, 4) === 'OggS') {
    const scan = Math.min(view.byteLength, 512);
    for (let at = 0; at + 16 <= scan; at++) {
      if (view.getUint8(at) === 1 && ascii(view, at + 1, 6) === 'vorbis') return view.getUint32(at + 12, true) || null;
      if (ascii(view, at, 8) === 'OpusHead') return view.getUint32(at + 12, true) || 48_000;
    }
    return null;
  }
  // MP3: past an ID3 tag, its first frame's header.
  let at = 0;
  if (ascii(view, 0, 3) === 'ID3' && view.byteLength >= 10) {
    at = 10 + ((view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9));
  }
  for (const end = Math.min(view.byteLength - 3, at + 4096); at < end; at++) {
    if (view.getUint8(at) === 0xff && (view.getUint8(at + 1) & 0xe0) === 0xe0) {
      const version = (view.getUint8(at + 1) >> 3) & 0x3;
      const index = (view.getUint8(at + 2) >> 2) & 0x3;
      const rate = MP3_RATES[version]?.[index];
      if (rate) return rate;
    }
  }
  return null;
}

export interface AudioFile { audio: DecodedAudio; bitDepth: number | null; format: string | null }

/** A file decoded at its own rate (48 kHz if its header doesn't say), with its bit depth and format. */
export async function decodeAudioFile(bytes: ArrayBuffer, contentType: string | null): Promise<AudioFile> {
  const sampleRate = headerSampleRate(bytes) ?? 48_000;
  // decodeAudioData takes the buffer (it's detached after): a copy, so the bytes stay.
  const context = new OfflineAudioContext({ numberOfChannels: 1, length: 1, sampleRate });
  const decoded = await context.decodeAudioData(bytes.slice(0));
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, c) => decoded.getChannelData(c));
  return {
    audio: { sampleRate: decoded.sampleRate, channels },
    bitDepth: wavBitDepth(bytes),
    format: contentType ? contentType.split(';')[0].trim().toLowerCase() : null,
  };
}
