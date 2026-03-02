import { AppSettings, ModelConfig, ApplicationFormData } from './data/types';
import { DEFAULT_READER_PROMPT, DEFAULT_JUDGE_PROMPT } from './ai/prompts';

const STORAGE_KEYS = {
  settings: 'adek-verify-settings',
  lastForm: 'adek-verify-last-form',
  results: 'adek-verify-results',
  templates: 'adek-verify-templates',
  testTemplates: 'adek-verify-test-templates',
} as const;

// --- Student Template Types & Functions ---

export interface StudentTemplate {
  id: string;
  name: string;
  createdAt: string;
  formData: Omit<ApplicationFormData, 'student'> & {
    student: Omit<ApplicationFormData['student'], 'applicationNumber' | 'age' | 'registrationDate'>;
  };
}

export function loadTemplates(): StudentTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.templates);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTemplate(template: StudentTemplate): void {
  if (typeof window === 'undefined') return;
  const templates = loadTemplates();
  templates.push(template);
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const templates = loadTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(templates));
}

// --- Test Template Functions ---

export interface TestTemplateData {
  id: string;
  name: string;
  createdAt: string;
  documents: Array<{
    type: string;
    fileName: string;
    fileSize: number;
    base64: string;
    mimeType: string;
    preview: string;
  }>;
}

export function loadTestTemplates(): TestTemplateData[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.testTemplates);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTestTemplate(template: TestTemplateData): void {
  if (typeof window === 'undefined') return;
  const templates = loadTestTemplates();
  templates.push(template);
  localStorage.setItem(STORAGE_KEYS.testTemplates, JSON.stringify(templates));
}

export function deleteTestTemplate(id: string): void {
  if (typeof window === 'undefined') return;
  const templates = loadTestTemplates().filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.testTemplates, JSON.stringify(templates));
}

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
    name: 'GPT-5.2 Thinking',
    openrouterId: 'openai/gpt-5.2',
    enabled: true,
    role: 'reader',
    reasoningEffort: 'high',
  },
  {
    id: 'reader-3',
    name: 'Claude Sonnet 4.6',
    openrouterId: 'anthropic/claude-sonnet-4.6',
    enabled: true,
    role: 'reader',
    reasoningEffort: 'high',
  },
  {
    id: 'judge',
    name: 'Gemini 3.1 Pro Thinking',
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
