import { describe, expect, it } from 'vitest';
import { measureAudio, waveformPeaks, wavBitDepth } from './measureAudio';

const FS = 48_000;
const sine = (seconds: number, { hz = 1000, dbfs = -20, phase = 0, fs = FS } = {}) => {
  const amplitude = 10 ** (dbfs / 20);
  return Float32Array.from({ length: Math.round(seconds * fs) }, (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / fs + phase));
};
const file = { bitDepth: 24, format: 'audio/wav' };

// The values the standards give for their own test signals.
describe('measureAudio', () => {
  it('measures a 1 kHz tone as BS.1770 does: -3.01 LUFS less than its level in one channel, its level in two', () => {
    const mono = measureAudio({ sampleRate: FS, channels: [sine(10)] }, file);
    expect(mono.integratedLufs).toBeCloseTo(-23.01, 0);
    const stereo = measureAudio({ sampleRate: FS, channels: [sine(10), sine(10)] }, file);
    expect(stereo.integratedLufs).toBeCloseTo(-20, 0);
    expect(stereo).toMatchObject({ kind: 'audio', duration: 10, sampleRate: FS, channels: 2, bitDepth: 24, format: 'audio/wav' });
    // A steady tone: its short-term loudness is its integrated one, and it has no range.
    expect(stereo.shortTermLufsMax).toBeCloseTo(-20, 0);
    expect(stereo.lra).toBeCloseTo(0, 0);
    // A sine's RMS is 3 dB under its peak.
    expect(stereo.rms).toBeCloseTo(-23.01, 1);
  });

  it('weights the same at 44.1 kHz', () => {
    const at441 = measureAudio({ sampleRate: 44_100, channels: [sine(10, { fs: 44_100 }), sine(10, { fs: 44_100 })] }, file);
    expect(at441.integratedLufs).toBeCloseTo(-20, 0);
  });

  it('finds the true peak between samples', () => {
    // A quarter of the rate, sampled 45° off its crests: every sample is 3 dB under the peak.
    const tone = sine(1, { hz: FS / 4, dbfs: -6, phase: Math.PI / 4 });
    expect(20 * Math.log10(Math.max(...tone.map(Math.abs)))).toBeCloseTo(-9.03, 1);
    const measured = measureAudio({ sampleRate: FS, channels: [tone] }, file);
    expect(measured.truePeak!).toBeGreaterThan(-6.6);
    expect(measured.truePeak!).toBeLessThan(-5.5);
  });

  it('measures the range of a level that changes', () => {
    // Ten seconds at -20 and ten at -30: a loudness range of about 10 LU.
    const changing = Float32Array.from([...sine(10, { dbfs: -20 }), ...sine(10, { dbfs: -30 })]);
    const measured = measureAudio({ sampleRate: FS, channels: [changing, changing] }, file);
    expect(measured.lra!).toBeGreaterThan(8.5);
    expect(measured.lra!).toBeLessThan(10.5);
    expect(measured.shortTermLufsMax).toBeCloseTo(-20, 0);
  });

  it('has no levels for silence, and gates it out of a file with sound', () => {
    const silent = measureAudio({ sampleRate: FS, channels: [new Float32Array(FS * 2)] }, { bitDepth: null, format: null });
    expect(silent).toMatchObject({ integratedLufs: null, shortTermLufsMax: null, truePeak: null, rms: null, lra: null, bitDepth: null });
    // Silence around a tone is gated out: averaged in, it would be -24.8 LUFS. Only the blocks
    // half on its edges, over the relative gate, take it a little under -20.
    const padded = Float32Array.from([...new Float32Array(FS * 5), ...sine(5), ...new Float32Array(FS * 5)]);
    const gated = measureAudio({ sampleRate: FS, channels: [padded, padded] }, file).integratedLufs!;
    expect(gated).toBeGreaterThan(-21);
    expect(gated).toBeLessThan(-19.9);
  });

  it('measures a file shorter than its blocks', () => {
    const blip = measureAudio({ sampleRate: FS, channels: [sine(0.2), sine(0.2)] }, file);
    expect(blip.duration).toBe(0.2);
    expect(blip.integratedLufs).toBeCloseTo(-20, 0);
  });
});

describe('wavBitDepth', () => {
  const wav = (bits: number, extra = 0) => {
    const bytes = new ArrayBuffer(44 + extra);
    const view = new DataView(bytes);
    const tag = (at: number, text: string) => [...text].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
    tag(0, 'RIFF'); tag(8, 'WAVE');
    let at = 12;
    // A chunk before fmt (as some tools write), to be skipped.
    if (extra) { tag(at, 'JUNK'); view.setUint32(at + 4, extra - 8, true); at += extra; }
    tag(at, 'fmt '); view.setUint32(at + 4, 16, true); view.setUint16(at + 22, bits, true);
    return bytes;
  };

  it("reads a WAV's bits per sample, past other chunks; nothing for another format", () => {
    expect(wavBitDepth(wav(24))).toBe(24);
    expect(wavBitDepth(wav(16, 28))).toBe(16);
    expect(wavBitDepth(new TextEncoder().encode('OggS and the rest').buffer as ArrayBuffer)).toBeNull();
    expect(wavBitDepth(new ArrayBuffer(4))).toBeNull();
  });
});

describe('waveformPeaks', () => {
  it("is each slice's lowest and highest sample, of all its channels", () => {
    const left = Float32Array.from([0.1, -0.5, 0.2, 0.9]);
    const right = Float32Array.from([-0.8, 0, 0, 0.3]);
    expect(waveformPeaks([left, right], 2)).toEqual([
      { min: expect.closeTo(-0.8, 5), max: expect.closeTo(0.1, 5) },
      { min: 0, max: expect.closeTo(0.9, 5) },
    ]);
    expect(waveformPeaks([new Float32Array(0)], 10)).toEqual([]);
  });
});
