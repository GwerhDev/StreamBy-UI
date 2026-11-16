import type { AudioMeasurements } from '../services/assetMeasurements';

// What a decoded audio file measures, as the inspector sends it: its format, its loudness as
// ITU-R BS.1770-4 / EBU R 128 have it (integrated and short-term LUFS, the loudness range of
// EBU Tech 3342), its true peak (4x oversampled), its RMS. Silence has no level: null.

export interface DecodedAudio {
  sampleRate: number;
  // Each channel's samples, -1 to 1.
  channels: Float32Array[];
}

const dB = (power: number) => (power > 0 ? 10 * Math.log10(power) : -Infinity);
const levelOrNull = (value: number) => (Number.isFinite(value) ? Math.round(value * 100) / 100 : null);

// ── K-weighting: a high shelf and a high pass, each a biquad, for any sample rate ──

interface Biquad { b0: number; b1: number; b2: number; a1: number; a2: number }

function shelf(fs: number): Biquad {
  const G = 3.99984385397, Q = 0.7071752369554193, fc = 1681.9744509555319;
  const A = 10 ** (G / 40), w0 = (2 * Math.PI * fc) / fs, alpha = Math.sin(w0) / (2 * Q), cos = Math.cos(w0), sq = 2 * Math.sqrt(A) * alpha;
  const a0 = (A + 1) - (A - 1) * cos + sq;
  return {
    b0: (A * ((A + 1) + (A - 1) * cos + sq)) / a0,
    b1: (-2 * A * ((A - 1) + (A + 1) * cos)) / a0,
    b2: (A * ((A + 1) + (A - 1) * cos - sq)) / a0,
    a1: (2 * ((A - 1) - (A + 1) * cos)) / a0,
    a2: ((A + 1) - (A - 1) * cos - sq) / a0,
  };
}

function highPass(fs: number): Biquad {
  const Q = 0.5003270373253953, fc = 38.13547087613982;
  const w0 = (2 * Math.PI * fc) / fs, alpha = Math.sin(w0) / (2 * Q), cos = Math.cos(w0), a0 = 1 + alpha;
  return { b0: (1 + cos) / 2 / a0, b1: -(1 + cos) / a0, b2: (1 + cos) / 2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
}

function filtered(samples: Float32Array, filters: Biquad[]): Float32Array {
  let input = samples;
  for (const f of filters) {
    const out = new Float32Array(input.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const y = f.b0 * x + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
      out[i] = y; x2 = x1; x1 = x; y2 = y1; y1 = y;
    }
    input = out;
  }
  return input;
}

// Each channel's weight: L, R, C 1; the surrounds of a 5.1 1.41; its LFE not counted.
const weightOf = (index: number, count: number) => (count === 6 ? (index === 3 ? 0 : index >= 4 ? 1.41 : 1) : 1);

/**
 * The K-weighted mean square power of each block (`blockSeconds` long, one every `stepSeconds`),
 * the channels summed by their weights. A file shorter than a block is one block, as long as it.
 */
function blockPowers(weighted: Float32Array[], fs: number, blockSeconds: number, stepSeconds: number): number[] {
  const length = weighted[0]?.length ?? 0;
  const block = Math.min(length, Math.round(blockSeconds * fs));
  const step = Math.max(1, Math.round(stepSeconds * fs));
  if (!block) return [];
  // Running sums of squares, so a block's sum is a difference.
  const cumulative = weighted.map(ch => {
    const sums = new Float64Array(ch.length + 1);
    for (let i = 0; i < ch.length; i++) sums[i + 1] = sums[i] + ch[i] * ch[i];
    return sums;
  });
  const powers: number[] = [];
  for (let start = 0; start + block <= length; start += step) {
    let power = 0;
    cumulative.forEach((sums, c) => { power += weightOf(c, weighted.length) * ((sums[start + block] - sums[start]) / block); });
    powers.push(power);
  }
  return powers;
}

const loudnessOf = (power: number) => -0.691 + dB(power);
const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;

/** Integrated loudness (LUFS) of 400 ms blocks, gated at -70 LUFS and 10 LU under their mean. */
function integrated(powers: number[]): number {
  const absolute = powers.filter(p => loudnessOf(p) > -70);
  if (!absolute.length) return -Infinity;
  const threshold = loudnessOf(mean(absolute)) - 10;
  const relative = absolute.filter(p => loudnessOf(p) > threshold);
  return relative.length ? loudnessOf(mean(relative)) : -Infinity;
}

/** Loudness range (LU): the 10th to the 95th percentile of short-term loudness, gated at -70 and 20 LU under. */
function loudnessRange(shortTerm: number[]): number {
  const absolute = shortTerm.filter(p => loudnessOf(p) > -70);
  if (!absolute.length) return -Infinity;
  const threshold = loudnessOf(mean(absolute)) - 20;
  const levels = absolute.filter(p => loudnessOf(p) > threshold).map(loudnessOf).sort((a, b) => a - b);
  if (!levels.length) return -Infinity;
  const at = (q: number) => levels[Math.min(levels.length - 1, Math.max(0, Math.round(q * (levels.length - 1))))];
  return at(0.95) - at(0.1);
}

// ── True peak: 4x oversampled, each in-between sample interpolated by a windowed sinc ──

const PHASES = 4;
const TAPS = 12;
const POLYPHASE: Float64Array[] = Array.from({ length: PHASES }, (_, phase) => {
  const taps = new Float64Array(TAPS);
  for (let k = 0; k < TAPS; k++) {
    // Where the input sample k is, from the point interpolated (in input samples).
    const t = k - (TAPS / 2 - 1) - phase / PHASES;
    const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t);
    const window = 0.5 + 0.5 * Math.cos((Math.PI * t) / (TAPS / 2));
    taps[k] = sinc * window;
  }
  return taps;
});

function truePeakOf(channels: Float32Array[]): number {
  let peak = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const s = Math.abs(ch[i]);
      if (s > peak) peak = s;
    }
    // Between each pair of samples, the points that weren't sampled.
    for (let i = TAPS / 2 - 1; i + TAPS / 2 < ch.length; i++) {
      const start = i - (TAPS / 2 - 1);
      for (let phase = 1; phase < PHASES; phase++) {
        const taps = POLYPHASE[phase];
        let value = 0;
        for (let k = 0; k < TAPS; k++) value += taps[k] * ch[start + k];
        const a = Math.abs(value);
        if (a > peak) peak = a;
      }
    }
  }
  return 20 * Math.log10(peak || 0);
}

function rmsOf(channels: Float32Array[]): number {
  let sum = 0;
  let count = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    count += ch.length;
  }
  return count ? dB(sum / count) : -Infinity;
}

/** A WAV's bits per sample, from its fmt chunk; null for anything else (a compressed file). */
export function wavBitDepth(bytes: ArrayBuffer): number | null {
  const view = new DataView(bytes);
  const tag = (at: number) => String.fromCharCode(view.getUint8(at), view.getUint8(at + 1), view.getUint8(at + 2), view.getUint8(at + 3));
  if (bytes.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  for (let at = 12; at + 8 <= bytes.byteLength;) {
    const size = view.getUint32(at + 4, true);
    if (tag(at) === 'fmt ' && at + 24 <= bytes.byteLength) return view.getUint16(at + 22, true) || null;
    at += 8 + size + (size % 2);
  }
  return null;
}

/** What a decoded file measures (bitDepth and format are the file's own, given). */
export function measureAudio(audio: DecodedAudio, file: { bitDepth: number | null; format: string | null }, tool = 'streamby-inspector'): AudioMeasurements {
  const fs = audio.sampleRate;
  const weighted = audio.channels.map(ch => filtered(ch, [shelf(fs), highPass(fs)]));
  const momentary = blockPowers(weighted, fs, 0.4, 0.1);
  const shortTerm = blockPowers(weighted, fs, 3, 0.1);
  const length = audio.channels[0]?.length ?? 0;
  return {
    kind: 'audio',
    duration: Math.round((length / fs) * 1000) / 1000,
    sampleRate: fs,
    channels: audio.channels.length,
    bitDepth: file.bitDepth,
    format: file.format,
    integratedLufs: levelOrNull(integrated(momentary)),
    shortTermLufsMax: levelOrNull(shortTerm.length ? Math.max(...shortTerm.map(loudnessOf)) : -Infinity),
    truePeak: levelOrNull(truePeakOf(audio.channels)),
    rms: levelOrNull(rmsOf(audio.channels)),
    lra: levelOrNull(loudnessRange(shortTerm)),
    tool,
  };
}

/** The waveform drawn: each of `buckets` slices' lowest and highest sample, all channels taken. */
export function waveformPeaks(channels: Float32Array[], buckets: number): { min: number; max: number }[] {
  const length = channels[0]?.length ?? 0;
  if (!length || buckets < 1) return [];
  const size = length / buckets;
  return Array.from({ length: buckets }, (_, b) => {
    let min = 0, max = 0;
    const from = Math.floor(b * size), to = Math.min(length, Math.max(from + 1, Math.floor((b + 1) * size)));
    for (const ch of channels) {
      for (let i = from; i < to; i++) {
        if (ch[i] < min) min = ch[i];
        if (ch[i] > max) max = ch[i];
      }
    }
    return { min, max };
  });
}
