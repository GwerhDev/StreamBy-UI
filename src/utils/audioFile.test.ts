import { describe, expect, it } from 'vitest';
import { headerSampleRate } from './audioFile';

const bytesOf = (size: number, write: (view: DataView, tag: (at: number, text: string) => void) => void) => {
  const bytes = new ArrayBuffer(size);
  const view = new DataView(bytes);
  write(view, (at, text) => [...text].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0))));
  return bytes;
};

describe('headerSampleRate', () => {
  it("reads a WAV's", () => {
    expect(headerSampleRate(bytesOf(44, (v, tag) => { tag(0, 'RIFF'); tag(8, 'WAVE'); tag(12, 'fmt '); v.setUint32(16, 16, true); v.setUint32(24, 48_000, true); }))).toBe(48_000);
  });

  it("reads a FLAC's, from its STREAMINFO", () => {
    // 44100 Hz: 20 bits from byte 18.
    expect(headerSampleRate(bytesOf(42, (v, tag) => { tag(0, 'fLaC'); v.setUint8(18, 0x0a); v.setUint8(19, 0xc4); v.setUint8(20, 0x42); }))).toBe(44_100);
  });

  it("reads an Ogg Vorbis' and an Opus' input rate", () => {
    expect(headerSampleRate(bytesOf(80, (v, tag) => { tag(0, 'OggS'); v.setUint8(28, 1); tag(29, 'vorbis'); v.setUint32(40, 44_100, true); }))).toBe(44_100);
    expect(headerSampleRate(bytesOf(80, (v, tag) => { tag(0, 'OggS'); tag(28, 'OpusHead'); v.setUint32(40, 96_000, true); }))).toBe(96_000);
  });

  it("reads an MP3's first frame, past its ID3 tag", () => {
    // MPEG-1 (version bits 11), 48 kHz (index 01), after a 20-byte tag.
    expect(headerSampleRate(bytesOf(64, (v, tag) => { tag(0, 'ID3'); v.setUint8(9, 10); v.setUint8(20, 0xff); v.setUint8(21, 0xfb); v.setUint8(22, 0x94); }))).toBe(48_000);
  });

  it("is null for what it can't read", () => {
    expect(headerSampleRate(new ArrayBuffer(8))).toBeNull();
  });
});
