import { ServiceProviderType } from '../../../interfaces';

// The speech to text providers a user connects to transcribe with StreamBy's own worker: each a
// key, and an OpenAI-compatible service (Groq, a whisper.cpp or LocalAI server...) its base URL.
export const SPEECH_PROVIDERS: { value: Extract<ServiceProviderType, 'openai' | 'deepgram' | 'assemblyai' | 'openai-compatible'>; label: string }[] = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'deepgram', label: 'Deepgram' },
  { value: 'assemblyai', label: 'AssemblyAI' },
  { value: 'openai-compatible', label: 'OpenAI-compatible service' },
];

export const isSpeechProvider = (provider: string) => SPEECH_PROVIDERS.some(p => p.value === provider);
