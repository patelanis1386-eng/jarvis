export interface VoiceOption {
  id: string;
  name: string;
  label: string;
  gender: "male" | "female" | "neutral";
  preview?: string;
  language: string;
  accent?: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  segments?: TranscriptionSegment[];
  language?: string;
  duration?: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface TTSOptions {
  text: string;
  voice?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
  format?: "mp3" | "wav" | "ogg" | "opus";
}

export interface AudioWaveform {
  peaks: Float32Array;
  samples: number;
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  volume: number;
}

export interface VoiceCommand {
  command: string;
  confidence: number;
  action: string;
  params?: Record<string, string>;
}

export interface VoiceActivityDetector {
  isSpeaking: boolean;
  threshold: number;
  silenceTimeout: number;
}
