// Types definition for Studio Copilot — Desarrollado por Pablito Studios

export type ActiveTab =
  | 'workspace-copilot'
  | 'servidores-mcp'
  | 'academia-de-lau'
  | 'mis-experiencias-y-assets'
  | 'configuracion-y-tokens-api';

export type AIProvider = 'gemini' | 'openrouter' | 'ollama' | 'replit';

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  isPinned?: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  email?: string;
}

export interface SettingsState {
  aiProvider: AIProvider;
  geminiModel: string;
  openrouterApiKey: string;
  openrouterModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  mcpBridgePort: number;
  mcpBridgeHost: string;
  autoSyncRojo: boolean;
  strictLuauValidation: boolean;
}

// Academy types
export interface CodeExercise {
  id: string;
  t: 'code';
  q: string;
  start: string;
  out: string[];
  hints: string[];
  sol: string;
  xp: number;
  c: string;
  re?: string;
  test?: string;
  ch?: number;
}

export interface MultipleChoiceExercise {
  id: string;
  t: 'mc';
  q: string;
  opts: string[];
  ans: number;
  why: string;
  xp: number;
  c: string;
  ch?: number;
}

export type Exercise = CodeExercise | MultipleChoiceExercise;

export interface Lesson {
  id: string;
  lv: number;
  title: string;
  goal: string;
  explain: string;
  code: string;
  why: string;
  def?: string;
  mis?: string[];
  ex: Exercise[];
}

export interface ProjectStep extends CodeExercise {}

export interface ProjectLesson {
  id: string;
  lv: number;
  title: string;
  goal: string;
  explain: string;
  code: string;
  why: string;
  def?: string;
  ex: CodeExercise[];
}

export interface ExamItem {
  id: string;
  t: 'mc' | 'code';
  q: string;
  opts?: string[];
  ans?: number;
  start?: string;
  out?: string[];
  re?: string;
  test?: string;
}

export interface AcademyProgress {
  xp: number;
  done: Record<string, number>;
  ex: Record<string, number>;
  due: Record<string, { i: number; d: string }>;
  exam: Record<number, number>;
  mis: Record<string, boolean>;
  streak: {
    cur: number;
    best: number;
    last: string | null;
  };
  miss: Record<string, number>;
  pos?: {
    id: string;
    E: number;
    mode: 'lesson' | 'practice' | 'levels';
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeSnippet?: {
    filename: string;
    code: string;
    tag?: string;
    linesAdded?: number;
    linesRemoved?: number;
  };
  mcpToolCall?: {
    toolName: string;
    status: 'success' | 'pending' | 'failed';
    latencyMs?: number;
  };
}

export interface McpServerInfo {
  id: string;
  name: string;
  status: 'online' | 'standby' | 'error';
  endpoint: string;
  latency: string;
  tools: string[];
  active: boolean;
  transport: string;
  description: string;
}

export interface RobloxExperience {
  id: string;
  ownerEmail?: string;
  title: string;
  description: string;
  placeId?: number;
  universeId?: number;
  category: 'production' | 'beta' | 'published';
  createdAt?: string;
  status?: string;
  version?: string;
  isRojoSyncActive?: boolean;
}

export interface ReusableAsset {
  id: string;
  title: string;
  category: string;
  description: string;
  type: 'ModuleScript' | 'Physics Tool' | 'Atmosphere Package' | 'ServerScriptService';
  tags: string[];
  version: string;
  linesCount: number;
  sizeOrLines: string;
  code: string;
}
