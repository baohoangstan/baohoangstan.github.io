import React, { useState, useEffect, useMemo, useRef } from 'react';
import styles from './styles.module.css';

// --- Types ---
type Provider = {
  id: string;
  name: string;
  api: string;
  doc: string;
  env: string[];
  models: string[];
  modelLimits?: Record<string, { context?: number; output?: number }>;
};

type ProviderConfig = {
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
};

type ModelLimitOverride = {
  contextTokens?: string;
  maxTokens?: string;
};

const DEFAULT_PROVIDERS: Record<string, Provider> = {
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
  }
};

const AGENTS = ['sisyphus', 'hephaestus', 'prometheus', 'oracle', 'librarian', 'explore', 'multimodal-looker', 'metis', 'momus', 'atlas'];
const CATEGORIES = ['visual-engineering', 'ultrabrain', 'deep', 'artistry', 'quick', 'unspecified-low', 'unspecified-high', 'writing'];

export default function SchemaConfigTool() {
  const [activeTab, setActiveTab] = useState<'opencode' | 'omo'>('opencode');
  const [providersData, setProvidersData] = useState<Record<string, Provider>>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opencode state
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, ProviderConfig>>({
    openai: { enabled: true, models: ['gpt-4o', 'gpt-4o-mini'] },
    anthropic: { enabled: true, models: ['claude-3-5-sonnet-20241022'] }
  });
  const [defaultModel, setDefaultModel] = useState<string>('anthropic/claude-3-5-sonnet-20241022');
  const [smallModel, setSmallModel] = useState<string>('openai/gpt-4o-mini');
  const [modelInputs, setModelInputs] = useState<Record<string, string>>({});
  // per-model token limit overrides: { "providerId/modelId": { contextTokens, maxTokens } }
  const [modelLimitOverrides, setModelLimitOverrides] = useState<Record<string, ModelLimitOverride>>({});

  // OMO state
  const [agentConfigs, setAgentConfigs] = useState<Record<string, string>>({
    sisyphus: 'anthropic/claude-3-5-sonnet-20241022',
    oracle: 'openai/o3-mini'
  });
  const [agentFallbacks, setAgentFallbacks] = useState<Record<string, string>>({});
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, string>>({
    'visual-engineering': 'anthropic/claude-3-5-sonnet-20241022',
    'quick': 'openai/gpt-4o-mini'
  });
  const [categoryFallbacks, setCategoryFallbacks] = useState<Record<string, string>>({});

  // Fetch models.dev
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://models.dev/api.json');
        if (response.ok) {
          const data = await response.json();
          const parsedProviders: Record<string, Provider> = {};

          for (const [key, val] of Object.entries(data)) {
            const typedVal = val as any;
            const modelLimits: Record<string, { context?: number; output?: number }> = {};
            if (typedVal.models) {
              for (const [modelId, modelData] of Object.entries(typedVal.models)) {
                const md = modelData as any;
                if (md?.limit) {
                  modelLimits[modelId] = {
                    context: md.limit.context,
                    output: md.limit.output,
                  };
                }
              }
            }
            parsedProviders[key] = {
              id: typedVal.id || key,
              name: typedVal.name || key,
              api: typedVal.api || '',
              doc: typedVal.doc || '',
              env: typedVal.env || [],
              models: typedVal.models ? Object.keys(typedVal.models) : [],
              modelLimits,
            };
          }

          setProvidersData({ ...DEFAULT_PROVIDERS, ...parsedProviders });
        }
      } catch (err) {
        console.warn('Failed to fetch models.dev, falling back to defaults', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  // --- Import local file ---
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (activeTab === 'opencode') {
          hydrateOpencodeState(json);
        } else {
          hydrateOmoState(json);
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported
    e.target.value = '';
  };

  const hydrateOpencodeState = (json: any) => {
    if (json.model) setDefaultModel(json.model);
    if (json.small_model) setSmallModel(json.small_model);
    if (json.provider) {
      const newConfigured: Record<string, ProviderConfig> = {};
      const newModelInputs: Record<string, string> = {};
      for (const [id, cfg] of Object.entries(json.provider)) {
        const c = cfg as any;
        newConfigured[id] = {
          enabled: true,
          apiKey: c.apiKey || c.api_key || '',
          baseURL: c.baseURL || c.base_url || '',
          timeout: c.timeout,
          models: Array.isArray(c.models) ? c.models : [],
        };
        newModelInputs[id] = Array.isArray(c.models) ? c.models.join(', ') : '';
      }
      setConfiguredProviders(newConfigured);
      setModelInputs(newModelInputs);
    }
  };

  const hydrateOmoState = (json: any) => {
    if (json.agents) {
      const newAgents: Record<string, string> = {};
      const newFallbacks: Record<string, string> = {};
      for (const [id, cfg] of Object.entries(json.agents)) {
        const c = cfg as any;
        if (c.model) newAgents[id] = c.model;
        if (Array.isArray(c.fallback_models)) newFallbacks[id] = c.fallback_models.join(', ');
      }
      setAgentConfigs(newAgents);
      setAgentFallbacks(newFallbacks);
    }
    if (json.categories) {
      const newCats: Record<string, string> = {};
      const newCatFallbacks: Record<string, string> = {};
      for (const [id, cfg] of Object.entries(json.categories)) {
        const c = cfg as any;
        if (c.model) newCats[id] = c.model;
        if (Array.isArray(c.fallback_models)) newCatFallbacks[id] = c.fallback_models.join(', ');
      }
      setCategoryConfigs(newCats);
      setCategoryFallbacks(newCatFallbacks);
    }
  };

  // --- Custom providers ---
  const [customProviderCount, setCustomProviderCount] = useState(0);

  const addCustomProvider = () => {
    const id = `custom_${Date.now()}`;
    setCustomProviderCount(c => c + 1);
    setConfiguredProviders(prev => ({
      ...prev,
      [id]: {
        enabled: true,
        isCustom: true,
        customId: id,
        customName: '',
        customApi: '',
        customEnv: '',
        models: [],
      }
    }));
    setModelInputs(prev => ({ ...prev, [id]: '' }));
  };

  const removeCustomProvider = (id: string) => {
    setConfiguredProviders(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setModelInputs(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Helpers for Opencode Config
  const handleProviderToggle = (providerId: string) => {
    setConfiguredProviders(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        enabled: !prev[providerId]?.enabled,
        models: prev[providerId]?.models || providersData[providerId]?.models?.slice(0, 5) || []
      }
    }));
  };

  const handleProviderConfigChange = (providerId: string, field: keyof ProviderConfig, value: any) => {
    setConfiguredProviders(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        [field]: value
      }
    }));
  };

  // Model limit helpers
  const getModelLimit = (providerId: string, modelId: string, field: 'context' | 'output'): number | undefined => {
    return providersData[providerId]?.modelLimits?.[modelId]?.[field];
  };

  const getOrAutoLimitValue = (providerId: string, modelId: string, field: 'contextTokens' | 'maxTokens'): string => {
    const key = `${providerId}/${modelId}`;
    if (modelLimitOverrides[key]?.[field] !== undefined) return modelLimitOverrides[key][field]!;
    const devField = field === 'contextTokens' ? 'context' : 'output';
    const auto = getModelLimit(providerId, modelId, devField);
    return auto !== undefined ? String(auto) : '';
  };

  const setModelLimitField = (providerId: string, modelId: string, field: 'contextTokens' | 'maxTokens', value: string) => {
    const key = `${providerId}/${modelId}`;
    setModelLimitOverrides(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  // Generate Output JSONs
  const opencodeJson = useMemo(() => {
    const providers: any = {};
    Object.entries(configuredProviders).forEach(([id, config]) => {
      if (!config.enabled) return;
      const effectiveId = config.isCustom ? (config.customName || id) : id;
      const providerModels: any[] = (config.models || []).map(modelId => {
        const key = `${id}/${modelId}`;
        const override = modelLimitOverrides[key];
        const autoContext = getModelLimit(id, modelId, 'context');
        const autoOutput = getModelLimit(id, modelId, 'output');
        const contextVal = override?.contextTokens !== undefined ? override.contextTokens : (autoContext !== undefined ? String(autoContext) : '');
        const outputVal = override?.maxTokens !== undefined ? override.maxTokens : (autoOutput !== undefined ? String(autoOutput) : '');
        if (contextVal || outputVal) {
          return {
            id: modelId,
            ...(contextVal ? { context_tokens: Number(contextVal) } : {}),
            ...(outputVal ? { max_tokens: Number(outputVal) } : {}),
          };
        }
        return modelId;
      });

      const entry: any = {
        ...(config.apiKey && { apiKey: config.apiKey }),
        ...(config.baseURL || (config.isCustom && config.customApi) ? { baseURL: config.baseURL || config.customApi } : {}),
        ...(config.timeout && { timeout: Number(config.timeout) }),
        models: providerModels,
      };

      if (config.isCustom) {
        if (config.customApi) entry.baseURL = config.customApi;
        if (config.customEnv) entry.env = [config.customEnv];
      }

      providers[effectiveId] = entry;
    });

    return JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: providers,
      model: defaultModel,
      small_model: smallModel
    }, null, 2);
  }, [configuredProviders, defaultModel, smallModel, modelLimitOverrides, providersData]);

  const omoJson = useMemo(() => {
    const agents: any = {};
    Object.entries(agentConfigs).forEach(([id, model]) => {
      if (!model) return;
      const fallbackRaw = agentFallbacks[id] || '';
      const fallbacks = fallbackRaw.split(',').map(s => s.trim()).filter(Boolean);
      agents[id] = {
        model,
        ...(fallbacks.length > 0 && { fallback_models: fallbacks }),
      };
    });

    const categories: any = {};
    Object.entries(categoryConfigs).forEach(([id, model]) => {
      if (!model) return;
      const fallbackRaw = categoryFallbacks[id] || '';
      const fallbacks = fallbackRaw.split(',').map(s => s.trim()).filter(Boolean);
      categories[id] = {
        model,
        ...(fallbacks.length > 0 && { fallback_models: fallbacks }),
      };
    });

    return JSON.stringify({
      $schema: "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
      agents,
      categories
    }, null, 2);
  }, [agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks]);

  const allAvailableModels = useMemo(() => {
    const models: string[] = [];
    Object.entries(configuredProviders).forEach(([providerId, config]) => {
      if (config.enabled && config.models) {
        config.models.forEach(m => models.push(`${providerId}/${m}`));
      }
    });
    Object.entries(providersData).forEach(([providerId, data]) => {
      if (data.models) {
        data.models.slice(0, 10).forEach(m => {
          const id = `${providerId}/${m}`;
          if (!models.includes(id)) models.push(id);
        });
      }
    });
    return models;
  }, [configuredProviders, providersData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Configuration Generator</h2>
        <div className={styles.headerRight}>
          <button
            className={styles.importBtn}
            onClick={() => fileInputRef.current?.click()}
            title={`Import existing ${activeTab === 'opencode' ? 'opencode.json' : 'oh-my-opencode.json'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'opencode' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('opencode')}
            >
              Opencode Config
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'omo' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('omo')}
            >
              Oh My Opencode
            </button>
          </div>
        </div>
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.editorPane}>
          {activeTab === 'opencode' ? (
            <div className={styles.opencodeConfig}>
              <div className={styles.section}>
                <div className={styles.sectionTitleRow}>
                  <h3 className={styles.sectionTitle}>Providers</h3>
                  <button className={styles.addBtn} onClick={addCustomProvider}>+ Add Custom Provider</button>
                </div>
                {loading && <p className={styles.loading}>Loading providers from models.dev...</p>}

                <div className={styles.providerList}>
                  {Object.entries(configuredProviders)
                    .filter(([, cfg]) => cfg.isCustom)
                    .map(([id, config]) => (
                      <div key={id} className={`${styles.providerCard} ${styles.enabled} ${styles.customProviderCard}`}>
                        <div className={styles.providerHeader}>
                          <span className={styles.customBadge}>Custom</span>
                          <div className={styles.customProviderFields}>
                            <input
                              type="text"
                              placeholder="Provider name (e.g. MyOpenAI)"
                              value={config.customName || ''}
                              onChange={e => handleProviderConfigChange(id, 'customName', e.target.value)}
                              className={styles.inlineInput}
                            />
                            <input
                              type="text"
                              placeholder="Base URL (e.g. https://my-proxy/v1)"
                              value={config.customApi || ''}
                              onChange={e => handleProviderConfigChange(id, 'customApi', e.target.value)}
                              className={styles.inlineInput}
                            />
                            <input
                              type="text"
                              placeholder="API key env var (e.g. MY_API_KEY)"
                              value={config.customEnv || ''}
                              onChange={e => handleProviderConfigChange(id, 'customEnv', e.target.value)}
                              className={styles.inlineInput}
                            />
                          </div>
                          <button className={styles.removeBtn} onClick={() => removeCustomProvider(id)}>×</button>
                        </div>
                        <div className={styles.providerSettings}>
                          <div className={styles.inputGroup}>
                            <label>API Key Value (optional)</label>
                            <input
                              type="text"
                              placeholder="Actual key value or leave blank"
                              value={config.apiKey || ''}
                              onChange={e => handleProviderConfigChange(id, 'apiKey', e.target.value)}
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label>Models (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="model-a, model-b"
                              value={modelInputs[id] ?? ''}
                              onChange={e => {
                                setModelInputs(prev => ({ ...prev, [id]: e.target.value }));
                                handleProviderConfigChange(id, 'models', e.target.value.split(',').map(s => s.trim()).filter(Boolean));
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                  {Object.entries(providersData).map(([id, provider]) => (
                    <div key={id} className={`${styles.providerCard} ${configuredProviders[id]?.enabled ? styles.enabled : ''}`}>
                      <div className={styles.providerHeader}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={!!configuredProviders[id]?.enabled}
                            onChange={() => handleProviderToggle(id)}
                          />
                          <span className={styles.providerName}>{provider.name}</span>
                        </label>
                      </div>

                      {configuredProviders[id]?.enabled && (
                        <div className={styles.providerSettings}>
                          <div className={styles.inputGroup}>
                            <label>API Key Variable</label>
                            <input
                              type="text"
                              placeholder={`e.g. \${${provider.env[0] || 'API_KEY'}}`}
                              value={configuredProviders[id]?.apiKey || ''}
                              onChange={e => handleProviderConfigChange(id, 'apiKey', e.target.value)}
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label>Base URL (Optional)</label>
                            <input
                              type="text"
                              placeholder={provider.api || "https://..."}
                              value={configuredProviders[id]?.baseURL || ''}
                              onChange={e => handleProviderConfigChange(id, 'baseURL', e.target.value)}
                            />
                          </div>
                          <div className={styles.inputGroup}>
                            <label>Enabled Models (comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Model names"
                              value={modelInputs[id] ?? (configuredProviders[id]?.models?.join(', ') || '')}
                              onChange={e => {
                                setModelInputs(prev => ({ ...prev, [id]: e.target.value }));
                                handleProviderConfigChange(id, 'models', e.target.value.split(',').map(s => s.trim()).filter(Boolean));
                              }}
                            />
                            <p className={styles.helpText}>Available: {provider.models?.slice(0, 10).join(', ')}{provider.models?.length > 10 ? '...' : ''}</p>
                          </div>

                          {/* Per-model token limits */}
                          {(configuredProviders[id]?.models || []).length > 0 && (
                            <div className={styles.modelLimitsSection}>
                              <p className={styles.modelLimitsLabel}>Model Token Limits <span className={styles.autoHint}>(auto-filled from models.dev)</span></p>
                              <div className={styles.modelLimitsGrid}>
                                {(configuredProviders[id]?.models || []).map(modelId => {
                                  const autoCtx = getModelLimit(id, modelId, 'context');
                                  const autoOut = getModelLimit(id, modelId, 'output');
                                  return (
                                    <div key={modelId} className={styles.modelLimitRow}>
                                      <span className={styles.modelLimitName}>{modelId}</span>
                                      <div className={styles.modelLimitInputs}>
                                        <div className={styles.limitField}>
                                          <label>Context</label>
                                          <input
                                            type="number"
                                            placeholder={autoCtx !== undefined ? String(autoCtx) : 'e.g. 128000'}
                                            value={getOrAutoLimitValue(id, modelId, 'contextTokens')}
                                            onChange={e => setModelLimitField(id, modelId, 'contextTokens', e.target.value)}
                                          />
                                        </div>
                                        <div className={styles.limitField}>
                                          <label>Max output</label>
                                          <input
                                            type="number"
                                            placeholder={autoOut !== undefined ? String(autoOut) : 'e.g. 4096'}
                                            value={getOrAutoLimitValue(id, modelId, 'maxTokens')}
                                            onChange={e => setModelLimitField(id, modelId, 'maxTokens', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Default Models</h3>
                <div className={styles.defaultModelsGrid}>
                  <div className={styles.inputGroup}>
                    <label>Default Model</label>
                    <input
                      type="text"
                      list="available-models"
                      value={defaultModel}
                      onChange={e => setDefaultModel(e.target.value)}
                      placeholder="provider/model"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Small Model</label>
                    <input
                      type="text"
                      list="available-models"
                      value={smallModel}
                      onChange={e => setSmallModel(e.target.value)}
                      placeholder="provider/model"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.omoConfig}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Agents</h3>
                <div className={styles.gridList}>
                  {AGENTS.map(agent => (
                    <div key={agent} className={styles.agentBlock}>
                      <label className={styles.agentLabel}>{agent}</label>
                      <input
                        type="text"
                        list="available-models"
                        value={agentConfigs[agent] || ''}
                        onChange={e => setAgentConfigs({ ...agentConfigs, [agent]: e.target.value })}
                        placeholder="Inherit default or provider/model"
                      />
                      <input
                        type="text"
                        list="available-models"
                        value={agentFallbacks[agent] || ''}
                        onChange={e => setAgentFallbacks({ ...agentFallbacks, [agent]: e.target.value })}
                        placeholder="Fallback models (comma-separated)"
                        className={styles.fallbackInput}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Categories</h3>
                <div className={styles.gridList}>
                  {CATEGORIES.map(category => (
                    <div key={category} className={styles.agentBlock}>
                      <label className={styles.agentLabel}>{category}</label>
                      <input
                        type="text"
                        list="available-models"
                        value={categoryConfigs[category] || ''}
                        onChange={e => setCategoryConfigs({ ...categoryConfigs, [category]: e.target.value })}
                        placeholder="Inherit default or provider/model"
                      />
                      <input
                        type="text"
                        list="available-models"
                        value={categoryFallbacks[category] || ''}
                        onChange={e => setCategoryFallbacks({ ...categoryFallbacks, [category]: e.target.value })}
                        placeholder="Fallback models (comma-separated)"
                        className={styles.fallbackInput}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <datalist id="available-models">
            {allAvailableModels.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div className={styles.previewPane}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>
              {activeTab === 'opencode' ? 'opencode.json' : 'oh-my-opencode.json'}
            </span>
            <button
              className={styles.copyBtn}
              onClick={() => copyToClipboard(activeTab === 'opencode' ? opencodeJson : omoJson)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <div className={styles.codeWrapper}>
            <pre className={styles.codeBlock}>
              <code>{activeTab === 'opencode' ? opencodeJson : omoJson}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
