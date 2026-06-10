import React, { useState, useEffect, useMemo } from 'react';
import styles from './styles.module.css';

// --- Types ---
type Provider = {
  id: string;
  name: string;
  api: string;
  doc: string;
  env: string[];
  models: string[];
};

type ProviderConfig = {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  models?: string[];
  enabled: boolean;
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

  // Opencode state
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, ProviderConfig>>({
    openai: { enabled: true, models: ['gpt-4o', 'gpt-4o-mini'] },
    anthropic: { enabled: true, models: ['claude-3-5-sonnet-20241022'] }
  });
  const [defaultModel, setDefaultModel] = useState<string>('anthropic/claude-3-5-sonnet-20241022');
  const [smallModel, setSmallModel] = useState<string>('openai/gpt-4o-mini');
  // Raw text for the comma-separated models inputs, so typed separators aren't stripped mid-edit.
  const [modelInputs, setModelInputs] = useState<Record<string, string>>({});

  // OMO state
  const [agentConfigs, setAgentConfigs] = useState<Record<string, string>>({
    sisyphus: 'anthropic/claude-3-5-sonnet-20241022',
    oracle: 'openai/o3-mini'
  });
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, string>>({
    'visual-engineering': 'anthropic/claude-3-5-sonnet-20241022',
    'quick': 'openai/gpt-4o-mini'
  });

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
            parsedProviders[key] = {
              id: typedVal.id || key,
              name: typedVal.name || key,
              api: typedVal.api || '',
              doc: typedVal.doc || '',
              env: typedVal.env || [],
              models: typedVal.models ? Object.keys(typedVal.models) : [],
            };
          }
          
          // Merge defaults to ensure we have our clean curated list too, or replace entirely
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

  // Generate Output JSONs
  const opencodeJson = useMemo(() => {
    const providers: any = {};
    Object.entries(configuredProviders).forEach(([id, config]) => {
      if (!config.enabled) return;
      providers[id] = {
        ...(config.apiKey && { apiKey: config.apiKey }),
        ...(config.baseURL && { baseURL: config.baseURL }),
        ...(config.timeout && { timeout: Number(config.timeout) }),
        models: config.models || []
      };
    });

    return JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: providers,
      model: defaultModel,
      small_model: smallModel
    }, null, 2);
  }, [configuredProviders, defaultModel, smallModel]);

  const omoJson = useMemo(() => {
    const agents: any = {};
    Object.entries(agentConfigs).forEach(([id, model]) => {
      if (model) agents[id] = { model };
    });

    const categories: any = {};
    Object.entries(categoryConfigs).forEach(([id, model]) => {
      if (model) categories[id] = { model };
    });

    return JSON.stringify({
      $schema: "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
      agents,
      categories
    }, null, 2);
  }, [agentConfigs, categoryConfigs]);

  const allAvailableModels = useMemo(() => {
    const models: string[] = [];
    Object.entries(configuredProviders).forEach(([providerId, config]) => {
      if (config.enabled && config.models) {
        config.models.forEach(m => models.push(`${providerId}/${m}`));
      }
    });
    // Add all provider defaults as fallback for OMO
    Object.entries(providersData).forEach(([providerId, data]) => {
      if(data.models) {
         data.models.slice(0,10).forEach(m => {
           const id = `${providerId}/${m}`;
           if(!models.includes(id)) models.push(id);
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

      <div className={styles.contentLayout}>
        <div className={styles.editorPane}>
          {activeTab === 'opencode' ? (
            <div className={styles.opencodeConfig}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Providers</h3>
                {loading && <p className={styles.loading}>Loading providers from models.dev...</p>}
                
                <div className={styles.providerList}>
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
                    <div key={agent} className={styles.inputGroup}>
                      <label className={styles.agentLabel}>{agent}</label>
                      <input 
                        type="text" 
                        list="available-models"
                        value={agentConfigs[agent] || ''}
                        onChange={e => setAgentConfigs({...agentConfigs, [agent]: e.target.value})}
                        placeholder="Inherit default or provider/model"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Categories</h3>
                <div className={styles.gridList}>
                  {CATEGORIES.map(category => (
                    <div key={category} className={styles.inputGroup}>
                      <label className={styles.agentLabel}>{category}</label>
                      <input 
                        type="text" 
                        list="available-models"
                        value={categoryConfigs[category] || ''}
                        onChange={e => setCategoryConfigs({...categoryConfigs, [category]: e.target.value})}
                        placeholder="Inherit default or provider/model"
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
