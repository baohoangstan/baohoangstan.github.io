// --- Shared types for the Schema Config tool ---

export type Provider = {
  id: string;
  name: string;
  api: string;
  doc: string;
  env: string[];
  models: string[];
  modelLimits?: Record<string, { context?: number; output?: number }>;
  modelNames?: Record<string, string>;
};

export type ProviderConfig = {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  models?: string[];
  enabled: boolean;
  isCustom?: boolean;
  customName?: string;
  customId?: string;
  customApi?: string;
  customEnv?: string;
  customNpm?: string;
  sourceProviders?: string[];
};

export type ModelLimitOverride = {
  contextTokens?: string;
  maxTokens?: string;
};

export type OmoSlimAgentConfig = {
  model?: string;
  variant?: string;
  skills?: string[];
  mcps?: string[];
};

export type PersistedState = {
  activeTab?: 'default' | 'opencode' | 'omo' | 'omoslim';
  configuredProviders?: Record<string, ProviderConfig>;
  defaultModel?: string;
  smallModel?: string;
  modelInputs?: Record<string, string>;
  modelLimitOverrides?: Record<string, ModelLimitOverride>;
  modelNameOverrides?: Record<string, string>;
  agentConfigs?: Record<string, string>;
  agentFallbacks?: Record<string, string>;
  agentProviders?: Record<string, string>;
  categoryConfigs?: Record<string, string>;
  categoryFallbacks?: Record<string, string>;
  categoryProviders?: Record<string, string>;
  // Oh My Opencode Slim
  omoslimPreset?: string;
  omoslimAgents?: Record<string, OmoSlimAgentConfig>;
  // Default (any-schema) tab
  defaultSchemaUrl?: string;
  defaultSchemaText?: string;
  defaultFormData?: unknown;
};

export type ValidationResult = { valid: boolean; message: string };
