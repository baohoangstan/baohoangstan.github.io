import { DEFAULT_CUSTOM_NPM } from './constants';
import type { ModelLimitOverride, Provider, ProviderConfig } from './types';

// --- Pure resolvers shared between JSON generation and the Opencode UI ---

export function resolveModelDataProvider(
  providersData: Record<string, Provider>,
  configuredProviders: Record<string, ProviderConfig>,
  providerId: string,
  modelId: string
): string | undefined {
  if (providersData[providerId]?.models?.includes(modelId)) return providerId;
  const config = configuredProviders[providerId];
  if (config?.isCustom) {
    return config.sourceProviders?.find(pid => providersData[pid]?.models?.includes(modelId));
  }
  return undefined;
}

export function getModelLimit(
  providersData: Record<string, Provider>,
  configuredProviders: Record<string, ProviderConfig>,
  providerId: string,
  modelId: string,
  field: 'context' | 'output'
): number | undefined {
  const dataProvider = resolveModelDataProvider(providersData, configuredProviders, providerId, modelId);
  return dataProvider ? providersData[dataProvider]?.modelLimits?.[modelId]?.[field] : undefined;
}

export function getAutoModelName(
  providersData: Record<string, Provider>,
  configuredProviders: Record<string, ProviderConfig>,
  providerId: string,
  modelId: string
): string | undefined {
  const dataProvider = resolveModelDataProvider(providersData, configuredProviders, providerId, modelId);
  return dataProvider ? providersData[dataProvider]?.modelNames?.[modelId] : undefined;
}

// --- JSON generation ---

export function buildOpencodeJson(args: {
  configuredProviders: Record<string, ProviderConfig>;
  defaultModel: string;
  smallModel: string;
  modelLimitOverrides: Record<string, ModelLimitOverride>;
  modelNameOverrides: Record<string, string>;
  providersData: Record<string, Provider>;
}): string {
  const { configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData } = args;
  const providers: any = {};
  Object.entries(configuredProviders).forEach(([id, config]) => {
    if (!config.enabled) return;
    const effectiveId = config.isCustom ? (config.customName || id) : id;
    const providerModels: Record<string, any> = {};
    (config.models || []).forEach(modelId => {
      const key = `${id}/${modelId}`;
      const override = modelLimitOverrides[key];
      const autoContext = getModelLimit(providersData, configuredProviders, id, modelId, 'context');
      const autoOutput = getModelLimit(providersData, configuredProviders, id, modelId, 'output');
      const contextVal = override?.contextTokens !== undefined ? override.contextTokens : (autoContext !== undefined ? String(autoContext) : '');
      const outputVal = override?.maxTokens !== undefined ? override.maxTokens : (autoOutput !== undefined ? String(autoOutput) : '');
      const limit: any = {
        ...(contextVal ? { context: Number(contextVal) } : {}),
        ...(outputVal ? { output: Number(outputVal) } : {}),
      };
      const nameKey = `${id}/${modelId}`;
      const nameVal = modelNameOverrides[nameKey] !== undefined
        ? modelNameOverrides[nameKey]
        : (getAutoModelName(providersData, configuredProviders, id, modelId) ?? '');
      providerModels[modelId] = {
        ...(nameVal ? { name: nameVal } : {}),
        ...(Object.keys(limit).length > 0 ? { limit } : {}),
      };
    });

    const entry: any = {
      ...(config.apiKey && { apiKey: config.apiKey }),
      ...(config.baseURL || (config.isCustom && config.customApi) ? { baseURL: config.baseURL || config.customApi } : {}),
      ...(config.timeout && { timeout: Number(config.timeout) }),
      models: providerModels,
    };

    if (config.isCustom) {
      const npm = config.customNpm || DEFAULT_CUSTOM_NPM;
      if (npm) entry.npm = npm;
      if (config.customApi) entry.baseURL = config.customApi;
      if (config.customEnv) entry.env = [config.customEnv];
    }

    providers[effectiveId] = entry;
  });

  return JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    provider: providers,
    model: defaultModel,
    small_model: smallModel,
  }, null, 2);
}

// --- Hydration (apply imported / edited JSON back into state) ---

export type OpencodeHydrateSetters = {
  providersData: Record<string, Provider>;
  setDefaultModel: (v: string) => void;
  setSmallModel: (v: string) => void;
  setConfiguredProviders: (v: Record<string, ProviderConfig>) => void;
  setModelInputs: (v: Record<string, string>) => void;
  setModelLimitOverrides: (v: Record<string, ModelLimitOverride>) => void;
  setModelNameOverrides: (v: Record<string, string>) => void;
};

export function hydrateOpencodeState(json: any, setters: OpencodeHydrateSetters) {
  const { providersData } = setters;
  if (json.model) setters.setDefaultModel(json.model);
  if (json.small_model) setters.setSmallModel(json.small_model);
  if (json.provider) {
    const newConfigured: Record<string, ProviderConfig> = {};
    const newModelInputs: Record<string, string> = {};
    const newLimitOverrides: Record<string, ModelLimitOverride> = {};
    const newNameOverrides: Record<string, string> = {};
    for (const [id, cfg] of Object.entries(json.provider)) {
      const c = cfg as any;
      const opts = c.options || {};
      const apiKey = c.apiKey ?? c.api_key ?? opts.apiKey ?? opts.api_key ?? '';
      const baseURL = c.baseURL ?? c.base_url ?? opts.baseURL ?? opts.base_url ?? '';
      const env = Array.isArray(c.env) ? c.env : [];
      const models = Array.isArray(c.models)
        ? c.models
        : c.models && typeof c.models === 'object'
          ? Object.keys(c.models)
          : [];
      const isCustom = !providersData[id];

      if (c.models && typeof c.models === 'object' && !Array.isArray(c.models)) {
        for (const [modelId, modelData] of Object.entries(c.models)) {
          const md = modelData as any;
          const key = `${id}/${modelId}`;
          if (md?.name) newNameOverrides[key] = md.name;
          if (md?.limit?.context !== undefined || md?.limit?.output !== undefined) {
            newLimitOverrides[key] = {
              ...(md.limit?.context !== undefined ? { contextTokens: String(md.limit.context) } : {}),
              ...(md.limit?.output !== undefined ? { maxTokens: String(md.limit.output) } : {}),
            };
          }
        }
      }

      newConfigured[id] = {
        enabled: true,
        apiKey,
        baseURL: isCustom ? '' : baseURL,
        timeout: c.timeout,
        models,
        ...(isCustom
          ? {
              isCustom: true,
              customId: id,
              customName: id,
              customApi: baseURL,
              customEnv: env[0] || '',
              customNpm: c.npm || DEFAULT_CUSTOM_NPM,
              sourceProviders: [],
            }
          : {}),
      };
      newModelInputs[id] = models.join(', ');
    }
    setters.setConfiguredProviders(newConfigured);
    setters.setModelInputs(newModelInputs);
    setters.setModelLimitOverrides(newLimitOverrides);
    setters.setModelNameOverrides(newNameOverrides);
  }
}
