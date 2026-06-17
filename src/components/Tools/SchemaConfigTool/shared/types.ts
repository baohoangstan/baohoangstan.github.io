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

export type KiloTri = '' | 'true' | 'false';
export type KiloPermissionAction = '' | 'allow' | 'ask' | 'deny';

export type KiloConfig = {
  model: string;
  small_model: string;
  default_agent: string;
  username: string;
  share: '' | 'manual' | 'auto' | 'disabled';
  autoupdate: '' | 'true' | 'false' | 'notify';
  snapshot: KiloTri;
  compactionAuto: KiloTri;
  compactionPrune: KiloTri;
  instructions: string[];
  plugin: string[];
  skillPaths: string[];
  skillUrls: string[];
  disabledProviders: string[];
  enabledProviders: string[];
  permissions: Record<string, KiloPermissionAction>;
  // Preserve object/glob-form and MCP/unknown permission entries that the
  // scalar form cannot represent, so imported configs round-trip losslessly.
  extraPermissions: Record<string, unknown>;
};

export type PersistedState = {
  activeTab?: 'default' | 'opencode' | 'omo' | 'omoslim' | 'kilo';
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
  omoslimPresets?: Record<string, Record<string, OmoSlimAgentConfig>>;
  omoslimDefaultPreset?: string;
  // Legacy single-preset fields (migrated into the multi-preset model on load).
  omoslimPreset?: string;
  omoslimAgents?: Record<string, OmoSlimAgentConfig>;
  // Kilo
  kiloConfig?: KiloConfig;
  // Default (any-schema) tab
  defaultSchemaUrl?: string;
  defaultSchemaText?: string;
  defaultFormData?: unknown;
};

export type ValidationResult = { valid: boolean; message: string };
