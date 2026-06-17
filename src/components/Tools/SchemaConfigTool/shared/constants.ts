import type { KiloConfig, Provider, ProviderConfig } from './types';

export const STORAGE_KEY = 'schemaConfigTool:v1';

export const fieldInput =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export const DEFAULT_CUSTOM_API = 'https://your-provider-url.com/v1';
export const DEFAULT_CUSTOM_KEY = 'your-key';
export const DEFAULT_CUSTOM_NPM = '@ai-sdk/openai-compatible';

export const AI_SDK_OPTIONS: { value: string; label: string }[] = [
  { value: '@ai-sdk/openai-compatible', label: 'OpenAI Compatible' },
  { value: '@ai-sdk/openai', label: 'OpenAI' },
  { value: '@ai-sdk/anthropic', label: 'Anthropic' },
  { value: '@ai-sdk/google', label: 'Google Generative AI' },
  { value: '@ai-sdk/google-vertex', label: 'Google Vertex' },
  { value: '@ai-sdk/amazon-bedrock', label: 'Amazon Bedrock' },
  { value: '@ai-sdk/azure', label: 'Azure OpenAI' },
  { value: '@ai-sdk/mistral', label: 'Mistral' },
  { value: '@ai-sdk/cohere', label: 'Cohere' },
  { value: '@ai-sdk/groq', label: 'Groq' },
  { value: '@openrouter/ai-sdk-provider', label: 'OpenRouter' },
];

export const DEFAULT_PROVIDERS: Record<string, Provider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    api: 'https://api.openai.com/v1',
    doc: 'https://platform.openai.com/docs/api-reference',
    env: ['OPENAI_API_KEY'],
    models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    api: 'https://api.anthropic.com/v1',
    doc: 'https://docs.anthropic.com/api/reference',
    env: ['ANTHROPIC_API_KEY'],
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  google: {
    id: 'google',
    name: 'Google',
    api: 'https://generativelanguage.googleapis.com/v1beta',
    doc: 'https://ai.google.dev/docs',
    env: ['GEMINI_API_KEY'],
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    doc: 'https://platform.deepseek.com/api-docs',
    env: ['DEEPSEEK_API_KEY'],
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    api: 'https://openrouter.ai/api/v1',
    doc: 'https://openrouter.ai/docs',
    env: ['OPENROUTER_API_KEY'],
    models: ['anthropic/claude-3.5-sonnet', 'google/gemini-2.5-pro', 'openai/gpt-4o', 'deepseek/deepseek-coder'],
  },
};

export const AGENTS = ['sisyphus', 'hephaestus', 'prometheus', 'oracle', 'librarian', 'explore', 'multimodal-looker', 'metis', 'momus', 'atlas'];
export const CATEGORIES = ['visual-engineering', 'ultrabrain', 'deep', 'artistry', 'quick', 'unspecified-low', 'unspecified-high', 'writing'];

// --- Oh My Opencode Slim (alvinunreal/oh-my-opencode-slim) ---
export const OMOSLIM_SCHEMA_URL = 'https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json';
export const OMOSLIM_AGENTS = ['orchestrator', 'oracle', 'librarian', 'explorer', 'designer', 'fixer'];
export const OMOSLIM_VARIANTS = ['low', 'medium', 'high'];
export const OMOSLIM_SKILLS = ['simplify', 'agent-browser', 'codemap', 'cartography'];
export const OMOSLIM_MCPS = ['websearch', 'context7', 'grep_app'];
export const DEFAULT_OMOSLIM_PRESET = 'openai';
export const DEFAULT_OMOSLIM_AGENTS: Record<string, { model?: string; variant?: string; skills?: string[]; mcps?: string[] }> = {
  orchestrator: { skills: ['*'], mcps: ['*'] },
  oracle: { variant: 'high', skills: ['simplify'], mcps: [] },
  librarian: { variant: 'low', skills: [], mcps: ['websearch', 'context7', 'grep_app'] },
  explorer: { variant: 'low', skills: [], mcps: [] },
  designer: { variant: 'medium', skills: ['agent-browser'], mcps: [] },
  fixer: { variant: 'low', skills: [], mcps: [] },
};

export const DEFAULT_CONFIGURED_PROVIDERS: Record<string, ProviderConfig> = {
  openai: { enabled: true, models: ['gpt-4o', 'gpt-4o-mini'] },
  anthropic: { enabled: true, models: ['claude-3-5-sonnet-20241022'] },
};
export const DEFAULT_AGENT_CONFIGS: Record<string, string> = {
  sisyphus: 'anthropic/claude-3-5-sonnet-20241022',
  oracle: 'openai/o3-mini',
};
export const DEFAULT_CATEGORY_CONFIGS: Record<string, string> = {
  'visual-engineering': 'anthropic/claude-3-5-sonnet-20241022',
  quick: 'openai/gpt-4o-mini',
};

export const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet-20241022';
export const DEFAULT_SMALL_MODEL = 'openai/gpt-4o-mini';

// --- Kilo CLI (kilo.json / kilo.jsonc) ---
export const KILO_SCHEMA_URL = 'https://app.kilo.ai/config.json';
export const KILO_PERMISSION_TOOLS = [
  'read',
  'edit',
  'bash',
  'glob',
  'grep',
  'list',
  'task',
  'webfetch',
  'websearch',
  'skill',
  'external_directory',
];
export const DEFAULT_KILO_CONFIG: KiloConfig = {
  model: '',
  small_model: '',
  default_agent: '',
  username: '',
  share: '',
  autoupdate: '',
  snapshot: '',
  compactionAuto: '',
  compactionPrune: '',
  instructions: [],
  plugin: [],
  skillPaths: [],
  skillUrls: [],
  disabledProviders: [],
  enabledProviders: [],
  permissions: Object.fromEntries(KILO_PERMISSION_TOOLS.map(t => [t, '' as const])),
  extraPermissions: {},
};
