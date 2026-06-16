import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_CONFIGURED_PROVIDERS,
  DEFAULT_AGENT_CONFIGS,
  DEFAULT_CATEGORY_CONFIGS,
  DEFAULT_MODEL,
  DEFAULT_SMALL_MODEL,
  DEFAULT_OMOSLIM_PRESET,
  DEFAULT_OMOSLIM_AGENTS,
  DEFAULT_KILO_CONFIG,
} from './constants';
import { clearPersisted, loadPersisted, savePersisted } from './persistence';
import { useProvidersData } from './useProvidersData';
import type { KiloConfig, ModelLimitOverride, OmoSlimAgentConfig, PersistedState, Provider, ProviderConfig } from './types';

export type SchemaTab = 'default' | 'opencode' | 'omo' | 'omoslim' | 'kilo';

type Setter<T> = React.Dispatch<React.SetStateAction<T>>;

export type SchemaConfigContextValue = {
  // catalog
  providersData: Record<string, Provider>;
  loading: boolean;
  // tab
  activeTab: SchemaTab;
  setActiveTab: Setter<SchemaTab>;
  // shared provider state
  configuredProviders: Record<string, ProviderConfig>;
  setConfiguredProviders: Setter<Record<string, ProviderConfig>>;
  defaultModel: string;
  setDefaultModel: Setter<string>;
  smallModel: string;
  setSmallModel: Setter<string>;
  modelInputs: Record<string, string>;
  setModelInputs: Setter<Record<string, string>>;
  modelLimitOverrides: Record<string, ModelLimitOverride>;
  setModelLimitOverrides: Setter<Record<string, ModelLimitOverride>>;
  modelNameOverrides: Record<string, string>;
  setModelNameOverrides: Setter<Record<string, string>>;
  // omo state
  agentConfigs: Record<string, string>;
  setAgentConfigs: Setter<Record<string, string>>;
  agentFallbacks: Record<string, string>;
  setAgentFallbacks: Setter<Record<string, string>>;
  agentProviders: Record<string, string>;
  setAgentProviders: Setter<Record<string, string>>;
  categoryConfigs: Record<string, string>;
  setCategoryConfigs: Setter<Record<string, string>>;
  categoryFallbacks: Record<string, string>;
  setCategoryFallbacks: Setter<Record<string, string>>;
  categoryProviders: Record<string, string>;
  setCategoryProviders: Setter<Record<string, string>>;
  // oh-my-opencode-slim state
  omoslimPreset: string;
  setOmoslimPreset: Setter<string>;
  omoslimAgents: Record<string, OmoSlimAgentConfig>;
  setOmoslimAgents: Setter<Record<string, OmoSlimAgentConfig>>;
  // kilo state
  kiloConfig: KiloConfig;
  setKiloConfig: Setter<KiloConfig>;
  // default (any-schema) tab state
  defaultSchemaUrl: string;
  setDefaultSchemaUrl: Setter<string>;
  defaultSchemaText: string;
  setDefaultSchemaText: Setter<string>;
  defaultFormData: unknown;
  setDefaultFormData: Setter<unknown>;
  // persisted snapshot at mount (for "load saved")
  initialPersisted: PersistedState;
  // global reset
  resetAll: () => void;
};

const SchemaConfigContext = createContext<SchemaConfigContextValue | null>(null);

export function useSchemaConfig(): SchemaConfigContextValue {
  const ctx = useContext(SchemaConfigContext);
  if (!ctx) throw new Error('useSchemaConfig must be used within <SchemaConfigProvider>');
  return ctx;
}

export function SchemaConfigProvider({ children }: { children: React.ReactNode }) {
  const persistedRef = useRef<PersistedState>(loadPersisted());
  const persisted = persistedRef.current;

  const { providersData, loading } = useProvidersData();

  const [activeTab, setActiveTab] = useState<SchemaTab>(persisted.activeTab ?? 'opencode');

  // Opencode / shared provider state
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, ProviderConfig>>(
    persisted.configuredProviders ?? DEFAULT_CONFIGURED_PROVIDERS
  );
  const [defaultModel, setDefaultModel] = useState<string>(persisted.defaultModel ?? DEFAULT_MODEL);
  const [smallModel, setSmallModel] = useState<string>(persisted.smallModel ?? DEFAULT_SMALL_MODEL);
  const [modelInputs, setModelInputs] = useState<Record<string, string>>(persisted.modelInputs ?? {});
  const [modelLimitOverrides, setModelLimitOverrides] = useState<Record<string, ModelLimitOverride>>(
    persisted.modelLimitOverrides ?? {}
  );
  const [modelNameOverrides, setModelNameOverrides] = useState<Record<string, string>>(
    persisted.modelNameOverrides ?? {}
  );

  // OMO state
  const [agentConfigs, setAgentConfigs] = useState<Record<string, string>>(persisted.agentConfigs ?? DEFAULT_AGENT_CONFIGS);
  const [agentFallbacks, setAgentFallbacks] = useState<Record<string, string>>(persisted.agentFallbacks ?? {});
  const [agentProviders, setAgentProviders] = useState<Record<string, string>>(persisted.agentProviders ?? {});
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, string>>(persisted.categoryConfigs ?? DEFAULT_CATEGORY_CONFIGS);
  const [categoryFallbacks, setCategoryFallbacks] = useState<Record<string, string>>(persisted.categoryFallbacks ?? {});
  const [categoryProviders, setCategoryProviders] = useState<Record<string, string>>(persisted.categoryProviders ?? {});

  // Oh My Opencode Slim state
  const [omoslimPreset, setOmoslimPreset] = useState<string>(persisted.omoslimPreset ?? DEFAULT_OMOSLIM_PRESET);
  const [omoslimAgents, setOmoslimAgents] = useState<Record<string, OmoSlimAgentConfig>>(
    persisted.omoslimAgents ?? DEFAULT_OMOSLIM_AGENTS
  );

  // Kilo state
  const [kiloConfig, setKiloConfig] = useState<KiloConfig>(persisted.kiloConfig ?? DEFAULT_KILO_CONFIG);

  // Default (any-schema) tab state
  const [defaultSchemaUrl, setDefaultSchemaUrl] = useState<string>(persisted.defaultSchemaUrl ?? '');
  const [defaultSchemaText, setDefaultSchemaText] = useState<string>(persisted.defaultSchemaText ?? '');
  const [defaultFormData, setDefaultFormData] = useState<unknown>(persisted.defaultFormData ?? {});

  useEffect(() => {
    const data: PersistedState = {
      activeTab,
      configuredProviders,
      defaultModel,
      smallModel,
      modelInputs,
      modelLimitOverrides,
      modelNameOverrides,
      agentConfigs,
      agentFallbacks,
      agentProviders,
      categoryConfigs,
      categoryFallbacks,
      categoryProviders,
      omoslimPreset,
      omoslimAgents,
      kiloConfig,
      defaultSchemaUrl,
      defaultSchemaText,
      defaultFormData,
    };
    savePersisted(data);
  }, [
    activeTab,
    configuredProviders,
    defaultModel,
    smallModel,
    modelInputs,
    modelLimitOverrides,
    modelNameOverrides,
    agentConfigs,
    agentFallbacks,
    agentProviders,
    categoryConfigs,
    categoryFallbacks,
    categoryProviders,
    omoslimPreset,
    omoslimAgents,
    kiloConfig,
    defaultSchemaUrl,
    defaultSchemaText,
    defaultFormData,
  ]);

  const resetAll = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Reset all configuration to defaults? This clears saved settings.');
      if (!ok) return;
      clearPersisted();
    }
    setConfiguredProviders(DEFAULT_CONFIGURED_PROVIDERS);
    setDefaultModel(DEFAULT_MODEL);
    setSmallModel(DEFAULT_SMALL_MODEL);
    setModelInputs({});
    setModelLimitOverrides({});
    setModelNameOverrides({});
    setAgentConfigs(DEFAULT_AGENT_CONFIGS);
    setAgentFallbacks({});
    setAgentProviders({});
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
    setCategoryFallbacks({});
    setCategoryProviders({});
    setOmoslimPreset(DEFAULT_OMOSLIM_PRESET);
    setOmoslimAgents(DEFAULT_OMOSLIM_AGENTS);
    setKiloConfig(DEFAULT_KILO_CONFIG);
    setDefaultSchemaUrl('');
    setDefaultSchemaText('');
    setDefaultFormData({});
  };

  const value = useMemo<SchemaConfigContextValue>(
    () => ({
      providersData,
      loading,
      activeTab,
      setActiveTab,
      configuredProviders,
      setConfiguredProviders,
      defaultModel,
      setDefaultModel,
      smallModel,
      setSmallModel,
      modelInputs,
      setModelInputs,
      modelLimitOverrides,
      setModelLimitOverrides,
      modelNameOverrides,
      setModelNameOverrides,
      agentConfigs,
      setAgentConfigs,
      agentFallbacks,
      setAgentFallbacks,
      agentProviders,
      setAgentProviders,
      categoryConfigs,
      setCategoryConfigs,
      categoryFallbacks,
      setCategoryFallbacks,
      categoryProviders,
      setCategoryProviders,
      omoslimPreset,
      setOmoslimPreset,
      omoslimAgents,
      setOmoslimAgents,
      kiloConfig,
      setKiloConfig,
      defaultSchemaUrl,
      setDefaultSchemaUrl,
      defaultSchemaText,
      setDefaultSchemaText,
      defaultFormData,
      setDefaultFormData,
      initialPersisted: persisted,
      resetAll,
    }),
    [
      providersData,
      loading,
      activeTab,
      configuredProviders,
      defaultModel,
      smallModel,
      modelInputs,
      modelLimitOverrides,
      modelNameOverrides,
      agentConfigs,
      agentFallbacks,
      agentProviders,
      categoryConfigs,
      categoryFallbacks,
      categoryProviders,
      omoslimPreset,
      omoslimAgents,
      kiloConfig,
      defaultSchemaUrl,
      defaultSchemaText,
      defaultFormData,
    ]
  );

  return <SchemaConfigContext.Provider value={value}>{children}</SchemaConfigContext.Provider>;
}
