import { AppSettings, ModelConfig } from './data/types';
import { DEFAULT_READER_PROMPT, DEFAULT_JUDGE_PROMPT } from './ai/prompts';

const STORAGE_KEYS = {
  settings: 'adek-verify-settings',
  lastForm: 'adek-verify-last-form',
  results: 'adek-verify-results',
} as const;

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'reader-1',
    name: 'Gemini 3 Flash',
    openrouterId: 'google/gemini-3-flash-preview',
    enabled: true,
    role: 'reader',
    reasoningEffort: 'high',
  },
  {
    id: 'reader-2',
    name: 'Gemini 3.1 Pro',
    openrouterId: 'google/gemini-3.1-pro-preview',
    enabled: true,
    role: 'reader',
    reasoningEffort: 'high',
  },
  {
    id: 'reader-3',
    name: 'GPT-5.2',
    openrouterId: 'openai/gpt-5.2',
    enabled: true,
    role: 'reader',
    reasoningEffort: 'high',
  },
  {
    id: 'judge',
    name: 'Gemini 3.1 Pro',
    openrouterId: 'google/gemini-3.1-pro-preview',
    enabled: true,
    role: 'judge',
    reasoningEffort: 'high',
  },
];

export function getDefaultSettings(): AppSettings {
  return {
    apiKey: '',
    readerPrompt: DEFAULT_READER_PROMPT,
    judgePrompt: DEFAULT_JUDGE_PROMPT,
    models: DEFAULT_MODELS,
    humanInLoop: true,
    parallelProcessing: true,
    thresholds: { approve: 80, review: 50 },
    language: 'ar',
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return getDefaultSettings();
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.settings);
    if (!stored) return getDefaultSettings();
    return { ...getDefaultSettings(), ...JSON.parse(stored) };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadLastForm(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.lastForm);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveLastForm(form: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.lastForm, JSON.stringify(form));
}
