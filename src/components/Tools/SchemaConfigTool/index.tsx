import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Upload, RotateCcw, X, Copy, Check, AlertCircle, RefreshCw } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { Highlight, themes, type PrismTheme } from 'prism-react-renderer';
import { useColorMode } from '@docusaurus/theme-common';
import { cn } from '@site/src/lib/utils';
import { Button } from '@site/src/components/ui/button';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { Badge } from '@site/src/components/ui/badge';
import { MultiSelect } from '@site/src/components/ui/multi-select';
import { Tabs, TabsList, TabsTrigger } from '@site/src/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@site/src/components/ui/select';

// --- Types ---
type Provider = {
  id: string;
  name: string;
  api: string;
  doc: string;
  env: string[];
  models: string[];
  modelLimits?: Record<string, { context?: number; output?: number }>;
  modelNames?: Record<string, string>;
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
  customNpm?: string;
  sourceProviders?: string[];
};

const DEFAULT_CUSTOM_API = 'https://your-provider-url.com/v1';
const DEFAULT_CUSTOM_KEY = 'your-key';
const DEFAULT_CUSTOM_NPM = '@ai-sdk/openai-compatible';

const AI_SDK_OPTIONS: { value: string; label: string }[] = [
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

type JsonPreviewProps = {
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
};

function JsonPreview({ value, onChange, error }: JsonPreviewProps) {
  const { colorMode } = useColorMode();
  const theme: PrismTheme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;
  const editorFont =
    'var(--ifm-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace)';

  const highlight = (code: string) => (
    <Highlight theme={theme} code={code} language="json">
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => {
            const { key: _lk, ...lineProps } = getLineProps({ line });
            return (
              <div key={i} {...lineProps}>
                {line.map((token, k) => {
                  const { key: _tk, ...tokenProps } = getTokenProps({ token });
                  return <span key={k} {...tokenProps} />;
                })}
              </div>
            );
          })}
        </>
      )}
    </Highlight>
  );

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: theme.plain.backgroundColor, color: theme.plain.color }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={20}
        spellCheck={false}
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: editorFont,
          fontSize: 13,
          lineHeight: 1.6,
          minHeight: '100%',
          caretColor: theme.plain.color,
        }}
      />
      {error && (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-destructive/40 bg-destructive/15 px-4 py-2 text-xs text-destructive backdrop-blur">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

const STORAGE_KEY = 'schemaConfigTool:v1';

const DEFAULT_CONFIGURED_PROVIDERS: Record<string, ProviderConfig> = {
  openai: { enabled: true, models: ['gpt-4o', 'gpt-4o-mini'] },
  anthropic: { enabled: true, models: ['claude-3-5-sonnet-20241022'] },
};
const DEFAULT_AGENT_CONFIGS: Record<string, string> = {
  sisyphus: 'anthropic/claude-3-5-sonnet-20241022',
  oracle: 'openai/o3-mini',
};
const DEFAULT_CATEGORY_CONFIGS: Record<string, string> = {
  'visual-engineering': 'anthropic/claude-3-5-sonnet-20241022',
  quick: 'openai/gpt-4o-mini',
};

type PersistedState = {
  activeTab?: 'opencode' | 'omo';
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
};

function loadPersisted(): PersistedState {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : {};
  } catch {
    return {};
  }
}

type ValidationResult = { valid: boolean; message: string };

const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function validateOpencodeSchema(root: unknown): ValidationResult {
  if (!isPlainObject(root)) return { valid: false, message: 'Root must be an object.' };
  if (root.model !== undefined && typeof root.model !== 'string')
    return { valid: false, message: '"model" must be a string.' };
  if (root.small_model !== undefined && typeof root.small_model !== 'string')
    return { valid: false, message: '"small_model" must be a string.' };
  if (root.provider !== undefined) {
    if (!isPlainObject(root.provider)) return { valid: false, message: '"provider" must be an object.' };
    for (const [pid, prov] of Object.entries(root.provider)) {
      if (!isPlainObject(prov)) return { valid: false, message: `provider.${pid} must be an object.` };
      if (prov.models !== undefined && !isPlainObject(prov.models))
        return { valid: false, message: `provider.${pid}.models must be an object keyed by model id.` };
      if (isPlainObject(prov.models)) {
        for (const [mid, model] of Object.entries(prov.models)) {
          if (!isPlainObject(model)) return { valid: false, message: `provider.${pid}.models.${mid} must be an object.` };
          if (model.limit !== undefined) {
            if (!isPlainObject(model.limit))
              return { valid: false, message: `provider.${pid}.models.${mid}.limit must be an object.` };
            for (const lk of ['context', 'output', 'input'] as const) {
              if (model.limit[lk] !== undefined && typeof model.limit[lk] !== 'number')
                return { valid: false, message: `provider.${pid}.models.${mid}.limit.${lk} must be a number.` };
            }
          }
          if (model.name !== undefined && typeof model.name !== 'string')
            return { valid: false, message: `provider.${pid}.models.${mid}.name must be a string.` };
        }
      }
      if (prov.env !== undefined && !Array.isArray(prov.env))
        return { valid: false, message: `provider.${pid}.env must be an array.` };
    }
  }
  return { valid: true, message: 'Matches opencode schema.' };
}

function validateOmoSchema(root: unknown): ValidationResult {
  if (!isPlainObject(root)) return { valid: false, message: 'Root must be an object.' };
  for (const section of ['agents', 'categories'] as const) {
    if (root[section] === undefined) continue;
    if (!isPlainObject(root[section])) return { valid: false, message: `"${section}" must be an object.` };
    for (const [key, cfg] of Object.entries(root[section])) {
      if (!isPlainObject(cfg)) return { valid: false, message: `${section}.${key} must be an object.` };
      if (cfg.model !== undefined && typeof cfg.model !== 'string')
        return { valid: false, message: `${section}.${key}.model must be a string.` };
      if (cfg.fallback_models !== undefined && !Array.isArray(cfg.fallback_models))
        return { valid: false, message: `${section}.${key}.fallback_models must be an array.` };
    }
  }
  return { valid: true, message: 'Matches oh-my-opencode schema.' };
}

function stripJsonc(input: string): string {
  let out = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
        out += ch;
      }
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }
    out += ch;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

function parseJsonc<T = any>(input: string): T {
  return JSON.parse(stripJsonc(input)) as T;
}

export default function SchemaConfigTool() {
  const persistedRef = useRef<PersistedState>(loadPersisted());
  const persisted = persistedRef.current;

  const [activeTab, setActiveTab] = useState<'opencode' | 'omo'>(persisted.activeTab ?? 'opencode');
  const [providersData, setProvidersData] = useState<Record<string, Provider>>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opencode state
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, ProviderConfig>>(
    persisted.configuredProviders ?? DEFAULT_CONFIGURED_PROVIDERS
  );
  const [defaultModel, setDefaultModel] = useState<string>(persisted.defaultModel ?? 'anthropic/claude-3-5-sonnet-20241022');
  const [smallModel, setSmallModel] = useState<string>(persisted.smallModel ?? 'openai/gpt-4o-mini');
  const [modelInputs, setModelInputs] = useState<Record<string, string>>(persisted.modelInputs ?? {});
  // per-model token limit overrides: { "providerId/modelId": { contextTokens, maxTokens } }
  const [modelLimitOverrides, setModelLimitOverrides] = useState<Record<string, ModelLimitOverride>>(persisted.modelLimitOverrides ?? {});
  // per-model display-name overrides: { "providerId/modelId": name }
  const [modelNameOverrides, setModelNameOverrides] = useState<Record<string, string>>(persisted.modelNameOverrides ?? {});

  const [providerToAdd, setProviderToAdd] = useState<string>('');

  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [fetchStatus, setFetchStatus] = useState<Record<string, { loading: boolean; error?: string }>>({});

  // OMO state
  const [agentConfigs, setAgentConfigs] = useState<Record<string, string>>(persisted.agentConfigs ?? DEFAULT_AGENT_CONFIGS);
  const [agentFallbacks, setAgentFallbacks] = useState<Record<string, string>>(persisted.agentFallbacks ?? {});
  const [agentProviders, setAgentProviders] = useState<Record<string, string>>(persisted.agentProviders ?? {});
  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, string>>(persisted.categoryConfigs ?? DEFAULT_CATEGORY_CONFIGS);
  const [categoryFallbacks, setCategoryFallbacks] = useState<Record<string, string>>(persisted.categoryFallbacks ?? {});
  const [categoryProviders, setCategoryProviders] = useState<Record<string, string>>(persisted.categoryProviders ?? {});

  const opencodeImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota / serialization errors */
    }
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
  ]);

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
            const modelNames: Record<string, string> = {};
            if (typedVal.models) {
              for (const [modelId, modelData] of Object.entries(typedVal.models)) {
                const md = modelData as any;
                if (md?.limit) {
                  modelLimits[modelId] = {
                    context: md.limit.context,
                    output: md.limit.output,
                  };
                }
                if (md?.name) modelNames[modelId] = md.name;
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
              modelNames,
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
        const json = parseJsonc(ev.target?.result as string);
        if (activeTab === 'opencode') {
          hydrateOpencodeState(json);
        } else {
          hydrateOmoState(json);
        }
      } catch {
        alert('Invalid JSON/JSONC file.');
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
      setConfiguredProviders(newConfigured);
      setModelInputs(newModelInputs);
      setModelLimitOverrides(newLimitOverrides);
      setModelNameOverrides(newNameOverrides);
    }
  };

  const hydrateOmoState = (json: any) => {
    if (json.agents) {
      const newAgents: Record<string, string> = {};
      const newFallbacks: Record<string, string> = {};
      for (const [id, cfg] of Object.entries(json.agents)) {
        const c = cfg as any;
        if (c.model) newAgents[id] = c.model;
        if (Array.isArray(c.fallback_models))
          newFallbacks[id] = c.fallback_models
            .map((f: any) => (typeof f === 'string' ? f : f?.model))
            .filter(Boolean)
            .join(', ');
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
        if (Array.isArray(c.fallback_models))
          newCatFallbacks[id] = c.fallback_models
            .map((f: any) => (typeof f === 'string' ? f : f?.model))
            .filter(Boolean)
            .join(', ');
      }
      setCategoryConfigs(newCats);
      setCategoryFallbacks(newCatFallbacks);
    }
  };

  const addCustomProvider = () => {
    const id = `custom_${Date.now()}`;
    setConfiguredProviders(prev => ({
      ...prev,
      [id]: {
        enabled: true,
        isCustom: true,
        customId: id,
        customName: '',
        customApi: DEFAULT_CUSTOM_API,
        customEnv: '',
        customNpm: DEFAULT_CUSTOM_NPM,
        apiKey: DEFAULT_CUSTOM_KEY,
        models: [],
        sourceProviders: ['anthropic', 'openai'],
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
  const addProvider = (providerId: string) => {
    if (!providerId) return;
    setConfiguredProviders(prev => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        enabled: true,
        models: prev[providerId]?.models?.length
          ? prev[providerId].models
          : providersData[providerId]?.models?.slice(0, 5) || [],
      },
    }));
    setProviderToAdd('');
  };

  const removeProvider = (providerId: string) => {
    setConfiguredProviders(prev => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setModelInputs(prev => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
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

  const setProviderModels = (providerId: string, models: string[]) => {
    handleProviderConfigChange(providerId, 'models', models);
    setModelInputs(prev => ({ ...prev, [providerId]: models.join(', ') }));
  };

  const buildModelOptions = (available?: string[], selected?: string[]) => {
    const seen = new Set<string>();
    const options: { value: string }[] = [];
    for (const m of [...(available || []), ...(selected || [])]) {
      if (!seen.has(m)) {
        seen.add(m);
        options.push({ value: m });
      }
    }
    return options;
  };

  const modelsFromProviders = (sourceProviders?: string[]): string[] => {
    const seen = new Set<string>();
    const models: string[] = [];
    for (const pid of sourceProviders || []) {
      for (const m of providersData[pid]?.models || []) {
        if (!seen.has(m)) {
          seen.add(m);
          models.push(m);
        }
      }
    }
    return models;
  };

  const setCustomSourceProviders = (id: string, sources: string[]) => {
    handleProviderConfigChange(id, 'sourceProviders', sources);
  };

  const fetchCustomProviderModels = async (id: string) => {
    const config = configuredProviders[id];
    const base = (config?.customApi || '').replace(/\/+$/, '');
    if (!base) {
      setFetchStatus(prev => ({ ...prev, [id]: { loading: false, error: 'Set a Base URL first.' } }));
      return;
    }
    setFetchStatus(prev => ({ ...prev, [id]: { loading: true } }));
    try {
      const headers: Record<string, string> = {};
      if (config?.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
      const res = await fetch(`${base}/models`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const ids = Array.from(
        new Set(
          list
            .map(m => (typeof m === 'string' ? m : m?.id))
            .filter((m): m is string => typeof m === 'string' && m.length > 0)
        )
      );
      if (ids.length === 0) throw new Error('No models in response.');
      setFetchedModels(prev => ({ ...prev, [id]: ids }));
      setFetchStatus(prev => ({ ...prev, [id]: { loading: false } }));
    } catch (e) {
      setFetchStatus(prev => ({ ...prev, [id]: { loading: false, error: (e as Error).message } }));
    }
  };

  // Model limit helpers
  const resolveModelDataProvider = (providerId: string, modelId: string): string | undefined => {
    if (providersData[providerId]?.models?.includes(modelId)) return providerId;
    const config = configuredProviders[providerId];
    if (config?.isCustom) {
      return config.sourceProviders?.find(pid => providersData[pid]?.models?.includes(modelId));
    }
    return undefined;
  };

  const getModelLimit = (providerId: string, modelId: string, field: 'context' | 'output'): number | undefined => {
    const dataProvider = resolveModelDataProvider(providerId, modelId);
    return dataProvider ? providersData[dataProvider]?.modelLimits?.[modelId]?.[field] : undefined;
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

  const getAutoModelName = (providerId: string, modelId: string): string | undefined => {
    const dataProvider = resolveModelDataProvider(providerId, modelId);
    return dataProvider ? providersData[dataProvider]?.modelNames?.[modelId] : undefined;
  };

  const getOrAutoModelName = (providerId: string, modelId: string): string => {
    const key = `${providerId}/${modelId}`;
    if (modelNameOverrides[key] !== undefined) return modelNameOverrides[key];
    return getAutoModelName(providerId, modelId) ?? '';
  };

  const setModelName = (providerId: string, modelId: string, value: string) => {
    const key = `${providerId}/${modelId}`;
    setModelNameOverrides(prev => ({ ...prev, [key]: value }));
  };

  const splitModelId = (modelId: string): { prefix: string; name: string } => {
    const slash = modelId.indexOf('/');
    return slash === -1
      ? { prefix: '', name: modelId }
      : { prefix: modelId.slice(0, slash), name: modelId.slice(slash + 1) };
  };

  const renameModelId = (providerId: string, oldModelId: string, newModelId: string) => {
    if (newModelId === oldModelId) return;
    setConfiguredProviders(prev => {
      const config = prev[providerId];
      if (!config) return prev;
      const models = (config.models || []).map(m => (m === oldModelId ? newModelId : m));
      return { ...prev, [providerId]: { ...config, models } };
    });
    setModelInputs(prev => ({
      ...prev,
      [providerId]: (configuredProviders[providerId]?.models || [])
        .map(m => (m === oldModelId ? newModelId : m))
        .join(', '),
    }));
    const oldKey = `${providerId}/${oldModelId}`;
    const newKey = `${providerId}/${newModelId}`;
    setModelLimitOverrides(prev => {
      if (prev[oldKey] === undefined) return prev;
      const next = { ...prev, [newKey]: prev[oldKey] };
      delete next[oldKey];
      return next;
    });
    setModelNameOverrides(prev => {
      if (prev[oldKey] === undefined) return prev;
      const next = { ...prev, [newKey]: prev[oldKey] };
      delete next[oldKey];
      return next;
    });
  };

  const setModelPrefix = (providerId: string, modelId: string, prefix: string) => {
    const { name } = splitModelId(modelId);
    const trimmed = prefix.trim();
    renameModelId(providerId, modelId, trimmed ? `${trimmed}/${name}` : name);
  };

  const renderModelOverrides = (id: string) => {
    const models = configuredProviders[id]?.models || [];
    if (models.length === 0) return null;
    const isCustom = !!configuredProviders[id]?.isCustom;
    return (
      <div className="border-t pt-3">
        <p className="m-0 mb-2 text-sm font-semibold text-muted-foreground">
          Model Overrides <span className="font-normal">(auto-filled from models.dev)</span>
        </p>
        <div className="flex flex-col gap-3">
          {models.map(modelId => {
            const autoCtx = getModelLimit(id, modelId, 'context');
            const autoOut = getModelLimit(id, modelId, 'output');
            const autoName = getAutoModelName(id, modelId);
            return (
              <div key={modelId} className="flex flex-col gap-1.5 rounded-md border bg-muted/30 p-2.5">
                <span className="font-mono text-xs font-semibold">{modelId}</span>
                <div className="flex flex-wrap gap-2">
                  {isCustom && (
                    <div className="flex min-w-[110px] flex-1 flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">Prefix</Label>
                      <Input
                        className="h-8 font-mono text-xs"
                        placeholder="e.g. boss"
                        value={splitModelId(modelId).prefix}
                        onChange={e => setModelPrefix(id, modelId, e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder={autoName || 'Display name'}
                      value={getOrAutoModelName(id, modelId)}
                      onChange={e => setModelName(id, modelId, e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-[110px] flex-1 flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Context</Label>
                    <Input
                      type="number"
                      className="h-8 font-mono text-xs"
                      placeholder={autoCtx !== undefined ? String(autoCtx) : 'e.g. 128000'}
                      value={getOrAutoLimitValue(id, modelId, 'contextTokens')}
                      onChange={e => setModelLimitField(id, modelId, 'contextTokens', e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-[110px] flex-1 flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">Max output</Label>
                    <Input
                      type="number"
                      className="h-8 font-mono text-xs"
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
    );
  };

  // Generate Output JSONs
  const opencodeJson = useMemo(() => {
    const providers: any = {};
    Object.entries(configuredProviders).forEach(([id, config]) => {
      if (!config.enabled) return;
      const effectiveId = config.isCustom ? (config.customName || id) : id;
      const providerModels: Record<string, any> = {};
      (config.models || []).forEach(modelId => {
        const key = `${id}/${modelId}`;
        const override = modelLimitOverrides[key];
        const autoContext = getModelLimit(id, modelId, 'context');
        const autoOutput = getModelLimit(id, modelId, 'output');
        const contextVal = override?.contextTokens !== undefined ? override.contextTokens : (autoContext !== undefined ? String(autoContext) : '');
        const outputVal = override?.maxTokens !== undefined ? override.maxTokens : (autoOutput !== undefined ? String(autoOutput) : '');
        const limit: any = {
          ...(contextVal ? { context: Number(contextVal) } : {}),
          ...(outputVal ? { output: Number(outputVal) } : {}),
        };
        const nameKey = `${id}/${modelId}`;
        const nameVal = modelNameOverrides[nameKey] !== undefined
          ? modelNameOverrides[nameKey]
          : (getAutoModelName(id, modelId) ?? '');
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
      $schema: "https://opencode.ai/config.json",
      provider: providers,
      model: defaultModel,
      small_model: smallModel
    }, null, 2);
  }, [configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData]);

  const omoJson = useMemo(() => {
    const parseFallbacks = (raw: string): string[] =>
      raw
        .split(',')
        .map(s => s.trim())
        .filter(s => s && !s.endsWith('/'));

    const agents: any = {};
    Object.entries(agentConfigs).forEach(([id, model]) => {
      if (!model) return;
      const fallbacks = parseFallbacks(agentFallbacks[id] || '');
      agents[id] = {
        model,
        ...(fallbacks.length > 0 && { fallback_models: fallbacks }),
      };
    });

    const categories: any = {};
    Object.entries(categoryConfigs).forEach(([id, model]) => {
      if (!model) return;
      const fallbacks = parseFallbacks(categoryFallbacks[id] || '');
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

  const customProviders = useMemo(
    () => Object.entries(configuredProviders).filter(([, cfg]) => cfg.isCustom),
    [configuredProviders]
  );

  const addedBuiltInProviders = useMemo(
    () =>
      Object.entries(providersData).filter(
        ([id]) => configuredProviders[id] && !configuredProviders[id].isCustom
      ),
    [providersData, configuredProviders]
  );

  const availableToAdd = useMemo(
    () =>
      Object.entries(providersData)
        .filter(([id]) => !configuredProviders[id])
        .sort((a, b) => a[1].name.localeCompare(b[1].name)),
    [providersData, configuredProviders]
  );

  const sourceProviderOptions = useMemo(
    () =>
      Object.entries(providersData)
        .filter(([, p]) => (p.models?.length ?? 0) > 0)
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .map(([pid, p]) => ({ value: pid, label: p.name })),
    [providersData]
  );

  const omoProviders = useMemo(() => {
    const list: { id: string; label: string; models: string[] }[] = [];
    Object.entries(configuredProviders).forEach(([id, config]) => {
      if (!config.enabled) return;
      const effectiveId = config.isCustom ? (config.customName || id) : id;
      if (!effectiveId) return;
      const label = config.isCustom
        ? config.customName || id
        : providersData[id]?.name || id;
      list.push({ id: effectiveId, label, models: config.models || [] });
    });
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [configuredProviders, providersData]);

  const omoProviderModels = (providerId: string): { value: string }[] => {
    const entry = omoProviders.find(p => p.id === providerId);
    return (entry?.models || []).map(m => ({ value: m }));
  };

  const providerOfModel = (model?: string): string => {
    if (!model) return '';
    const slash = model.indexOf('/');
    if (slash === -1) return '';
    const prefix = model.slice(0, slash);
    return omoProviders.some(p => p.id === prefix) ? prefix : '';
  };

  const getSectionProvider = (
    providerMap: Record<string, string>,
    configMap: Record<string, string>,
    key: string
  ): string => providerMap[key] ?? providerOfModel(configMap[key]);

  const setAgentProvider = (agent: string, providerId: string) => {
    setAgentProviders(prev => ({ ...prev, [agent]: providerId }));
    setAgentConfigs(prev => {
      const cur = prev[agent];
      if (cur && providerOfModel(cur) === providerId) return prev;
      return { ...prev, [agent]: '' };
    });
  };

  const setAgentModel = (agent: string, model: string) => {
    setAgentConfigs(prev => ({ ...prev, [agent]: model }));
  };

  const setCategoryProvider = (category: string, providerId: string) => {
    setCategoryProviders(prev => ({ ...prev, [category]: providerId }));
    setCategoryConfigs(prev => {
      const cur = prev[category];
      if (cur && providerOfModel(cur) === providerId) return prev;
      return { ...prev, [category]: '' };
    });
  };

  const setCategoryModel = (category: string, model: string) => {
    setCategoryConfigs(prev => ({ ...prev, [category]: model }));
  };

  const handleImportOpencodeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = parseJsonc(ev.target?.result as string);
        hydrateOpencodeState(json);
      } catch {
        alert('Invalid JSON/JSONC file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadSavedOpencode = () => {
    const saved = loadPersisted();
    if (saved.configuredProviders) {
      setConfiguredProviders(saved.configuredProviders);
      setModelInputs(saved.modelInputs ?? {});
      setModelLimitOverrides(saved.modelLimitOverrides ?? {});
      setModelNameOverrides(saved.modelNameOverrides ?? {});
      if (saved.defaultModel) setDefaultModel(saved.defaultModel);
      if (saved.smallModel) setSmallModel(saved.smallModel);
    } else if (typeof window !== 'undefined') {
      alert('No saved opencode config found in this browser.');
    }
  };

  const renderPmPair = (
    pairKey: string,
    provider: string,
    modelValue: string,
    onPickProvider: (v: string) => void,
    onPickModel: (v: string) => void,
    onRemove?: () => void
  ) => {
    const modelOptions = omoProviderModels(provider);
    const modelMatch = modelOptions.some(m => `${provider}/${m.value}` === modelValue);
    return (
      <div key={pairKey} className="flex items-center gap-2">
        <Select value={provider} onValueChange={onPickProvider}>
          <SelectTrigger className="h-9 flex-1 text-xs">
            <SelectValue placeholder="Provider…" />
          </SelectTrigger>
          <SelectContent>
            {omoProviders.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={modelMatch ? modelValue : ''}
          onValueChange={onPickModel}
          disabled={!provider || modelOptions.length === 0}
        >
          <SelectTrigger className="h-9 flex-1 text-xs">
            <SelectValue placeholder={provider ? 'Model…' : 'Pick provider'} />
          </SelectTrigger>
          <SelectContent>
            {modelOptions.map(m => (
              <SelectItem key={m.value} value={`${provider}/${m.value}`}>{m.value}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
            onClick={onRemove}
            title="Remove fallback"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const providerOfEntry = (entry: string): string => {
    const slash = entry.indexOf('/');
    return slash === -1 ? '' : entry.slice(0, slash);
  };

  const renderOmoRow = (
    key: string,
    selectedProvider: string,
    selectedModel: string,
    fallbackRaw: string,
    onProvider: (v: string) => void,
    onModel: (v: string) => void,
    onFallback: (v: string) => void
  ) => {
    const mainModel = providerOfModel(selectedModel) === selectedProvider ? selectedModel : '';
    const fallbackEntries = fallbackRaw.split(',').map(s => s.trim()).filter(Boolean);
    const commitFallbacks = (arr: string[]) => onFallback(arr.filter(Boolean).join(', '));
    const setFbProvider = (idx: number, prov: string) => {
      const next = [...fallbackEntries];
      next[idx] = prov ? `${prov}/` : '';
      commitFallbacks(next);
    };
    const setFbModel = (idx: number, full: string) => {
      const next = [...fallbackEntries];
      next[idx] = full;
      commitFallbacks(next);
    };
    const removeFb = (idx: number) => commitFallbacks(fallbackEntries.filter((_, i) => i !== idx));
    const addFb = (prov: string) => {
      if (prov) commitFallbacks([...fallbackEntries, `${prov}/`]);
    };

    return (
      <div key={key} className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
        <Label className="capitalize">{key}</Label>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Main</span>
          {renderPmPair(`${key}-main`, selectedProvider, mainModel, onProvider, onModel)}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Fallbacks</span>
          {fallbackEntries.map((entry, idx) =>
            renderPmPair(
              `${key}-fb-${idx}`,
              providerOfEntry(entry),
              entry,
              prov => setFbProvider(idx, prov),
              full => setFbModel(idx, full),
              () => removeFb(idx)
            )
          )}
          <Select value="" onValueChange={addFb}>
            <SelectTrigger className="h-9 border-dashed text-xs text-muted-foreground">
              <SelectValue placeholder="+ Add fallback provider…" />
            </SelectTrigger>
            <SelectContent>
              {omoProviders.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  };

  // While editing the preview, show the raw draft; valid JSON syncs back to form state.
  const [draft, setDraft] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<'opencode' | 'omo' | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const generatedJson = activeTab === 'opencode' ? opencodeJson : omoJson;
  const previewValue = editingTab === activeTab && draft !== null ? draft : generatedJson;

  const validation = useMemo<ValidationResult>(() => {
    let parsed: unknown;
    try {
      parsed = parseJsonc(previewValue);
    } catch (e) {
      return { valid: false, message: (e as Error).message };
    }
    return activeTab === 'opencode' ? validateOpencodeSchema(parsed) : validateOmoSchema(parsed);
  }, [previewValue, activeTab]);

  useEffect(() => {
    setDraft(null);
    setEditingTab(null);
    setJsonError(null);
  }, [activeTab]);

  const handlePreviewChange = (next: string) => {
    setDraft(next);
    setEditingTab(activeTab);
    try {
      const parsed = parseJsonc(next);
      if (activeTab === 'opencode') {
        hydrateOpencodeState(parsed);
      } else {
        hydrateOmoState(parsed);
      }
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handlePreviewBlur = () => {
    if (!jsonError) {
      setDraft(null);
      setEditingTab(null);
    }
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const resetAll = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Reset all configuration to defaults? This clears saved settings.');
      if (!ok) return;
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    setConfiguredProviders(DEFAULT_CONFIGURED_PROVIDERS);
    setDefaultModel('anthropic/claude-3-5-sonnet-20241022');
    setSmallModel('openai/gpt-4o-mini');
    setModelInputs({});
    setModelLimitOverrides({});
    setModelNameOverrides({});
    setProviderToAdd('');
    setAgentConfigs(DEFAULT_AGENT_CONFIGS);
    setAgentFallbacks({});
    setAgentProviders({});
    setCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
    setCategoryFallbacks({});
    setCategoryProviders({});
  };

  const fieldInput =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-xl font-semibold">Configuration Generator</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title={`Import existing ${activeTab === 'opencode' ? 'opencode.json(c)' : 'oh-my-opencode.json(c)'}`}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            title="Reset all configuration to defaults"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'opencode' | 'omo')}>
            <TabsList>
              <TabsTrigger value="opencode">Opencode Config</TabsTrigger>
              <TabsTrigger value="omo">Oh My Opencode</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto border-b p-6 lg:border-b-0 lg:border-r">
          {activeTab === 'opencode' ? (
            <div className="flex flex-col gap-8">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3 border-b pb-2">
                  <h3 className="m-0 text-lg font-semibold">Providers</h3>
                  <div className="flex items-center gap-2">
                    <Select value={providerToAdd} onValueChange={addProvider}>
                      <SelectTrigger className="h-8 w-[180px] text-xs">
                        <SelectValue placeholder="+ Add provider…" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableToAdd.map(([id, provider]) => (
                          <SelectItem key={id} value={id}>{provider.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={addCustomProvider}>+ Custom</Button>
                  </div>
                </div>
                {loading && <p className="text-sm italic text-muted-foreground">Loading providers from models.dev...</p>}

                {addedBuiltInProviders.length === 0 && customProviders.length === 0 && !loading && (
                  <p className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                    No providers added yet. Use “Add provider…” above to get started.
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  {customProviders.map(([id, config]) => (
                    <div key={id} className="overflow-hidden rounded-md border border-amber-500/60">
                      <div className="flex items-center gap-2 bg-muted/60 px-4 py-3">
                        <Badge className="bg-amber-500 text-black hover:bg-amber-500">Custom</Badge>
                        <div className="flex flex-1 flex-wrap gap-2">
                          <Input
                            className="min-w-[140px] flex-1 font-mono text-xs"
                            placeholder="Provider name (e.g. MyOpenAI)"
                            value={config.customName || ''}
                            onChange={e => handleProviderConfigChange(id, 'customName', e.target.value)}
                          />
                          <Input
                            className="min-w-[140px] flex-1 font-mono text-xs"
                            placeholder={DEFAULT_CUSTOM_API}
                            value={config.customApi || ''}
                            onChange={e => handleProviderConfigChange(id, 'customApi', e.target.value)}
                          />
                          <Input
                            className="min-w-[140px] flex-1 font-mono text-xs"
                            placeholder="API key env var (e.g. MY_API_KEY)"
                            value={config.customEnv || ''}
                            onChange={e => handleProviderConfigChange(id, 'customEnv', e.target.value)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => removeCustomProvider(id)}
                          title="Remove custom provider"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-4 border-t p-4">
                        <div className="flex flex-col gap-1.5">
                          <Label>AI SDK</Label>
                          <Select
                            value={config.customNpm || DEFAULT_CUSTOM_NPM}
                            onValueChange={v => handleProviderConfigChange(id, 'customNpm', v)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_SDK_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label} <span className="font-mono text-xs text-muted-foreground">({opt.value})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>API Key Value (optional)</Label>
                          <Input
                            className="font-mono text-sm"
                            placeholder={DEFAULT_CUSTOM_KEY}
                            value={config.apiKey || ''}
                            onChange={e => handleProviderConfigChange(id, 'apiKey', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Models from Providers</Label>
                          <MultiSelect
                            options={sourceProviderOptions}
                            selected={config.sourceProviders || []}
                            onChange={next => setCustomSourceProviders(id, next)}
                            placeholder="Select providers…"
                            searchPlaceholder="Search providers…"
                            emptyText="No providers"
                          />
                          <p className="m-0 text-xs text-muted-foreground">
                            Pull model ids from these providers into the selector below.
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Label>Models</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={fetchStatus[id]?.loading}
                              onClick={() => fetchCustomProviderModels(id)}
                            >
                              <RefreshCw className={cn('mr-1.5 h-3 w-3', fetchStatus[id]?.loading && 'animate-spin')} />
                              {fetchStatus[id]?.loading ? 'Fetching…' : 'Fetch models'}
                            </Button>
                          </div>
                          <MultiSelect
                            options={buildModelOptions(
                              [...modelsFromProviders(config.sourceProviders), ...(fetchedModels[id] || [])],
                              config.models
                            )}
                            selected={config.models || []}
                            onChange={next => setProviderModels(id, next)}
                            placeholder="Add models…"
                            searchPlaceholder="Search or type a model id…"
                            emptyText="Type a model id to add"
                            allowCustom
                          />
                          {fetchStatus[id]?.error ? (
                            <p className="m-0 text-xs text-destructive">Fetch failed: {fetchStatus[id]?.error}</p>
                          ) : (
                            <p className="m-0 text-xs text-muted-foreground">
                              {fetchedModels[id]?.length
                                ? `${fetchedModels[id].length} models fetched from provider — search to add, or type a custom id.`
                                : config.sourceProviders?.length
                                  ? `${modelsFromProviders(config.sourceProviders).length} models from selected providers — or fetch from the provider / type a custom id.`
                                  : 'Fetch from the provider, type a model id, or pick source providers above.'}
                            </p>
                          )}
                        </div>
                        {renderModelOverrides(id)}
                      </div>
                    </div>
                  ))}

                  {addedBuiltInProviders.map(([id, provider]) => (
                    <div key={id} className="overflow-hidden rounded-md border border-primary/40">
                      <div className="flex items-center justify-between gap-2 bg-muted/60 px-4 py-3">
                        <span className="font-semibold">{provider.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeProvider(id)}
                          title={`Remove ${provider.name}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col gap-4 border-t p-4">
                        <div className="flex flex-col gap-1.5">
                          <Label>API Key Variable</Label>
                          <Input
                            className="font-mono text-sm"
                            placeholder={`e.g. \${${provider.env[0] || 'API_KEY'}}`}
                            value={configuredProviders[id]?.apiKey || ''}
                            onChange={e => handleProviderConfigChange(id, 'apiKey', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Base URL (Optional)</Label>
                          <Input
                            className="font-mono text-sm"
                            placeholder={provider.api || 'https://...'}
                            value={configuredProviders[id]?.baseURL || ''}
                            onChange={e => handleProviderConfigChange(id, 'baseURL', e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label>Enabled Models</Label>
                          <MultiSelect
                            options={buildModelOptions(provider.models, configuredProviders[id]?.models)}
                            selected={configuredProviders[id]?.models || []}
                            onChange={next => setProviderModels(id, next)}
                            placeholder="Select models…"
                            searchPlaceholder="Search or add a model…"
                            emptyText="No matching models"
                            allowCustom
                          />
                          <p className="m-0 text-xs text-muted-foreground">
                            {provider.models?.length
                              ? `${provider.models.length} models available from models.dev — search to add, or type a custom id.`
                              : 'Type a model id and press Enter to add.'}
                          </p>
                        </div>

                        {renderModelOverrides(id)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Default Models</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Default Model</Label>
                    <input
                      className={fieldInput}
                      list="available-models"
                      value={defaultModel}
                      onChange={e => setDefaultModel(e.target.value)}
                      placeholder="provider/model"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Small Model</Label>
                    <input
                      className={fieldInput}
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
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Provider source</span>
                  <span className="text-xs text-muted-foreground">
                    {omoProviders.length
                      ? `${omoProviders.length} provider(s) available — configured in the Opencode Config tab.`
                      : 'No providers yet. Import an opencode.json or load your saved config.'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => opencodeImportRef.current?.click()}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Import opencode.json
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadSavedOpencode}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Load saved
                  </Button>
                  <input
                    ref={opencodeImportRef}
                    type="file"
                    accept=".json,.jsonc,application/json"
                    className="hidden"
                    onChange={handleImportOpencodeFile}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Agents</h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                  {AGENTS.map(agent =>
                    renderOmoRow(
                      agent,
                      getSectionProvider(agentProviders, agentConfigs, agent),
                      agentConfigs[agent] || '',
                      agentFallbacks[agent] || '',
                      v => setAgentProvider(agent, v),
                      v => setAgentModel(agent, v),
                      v => setAgentFallbacks(prev => ({ ...prev, [agent]: v }))
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Categories</h3>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                  {CATEGORIES.map(category =>
                    renderOmoRow(
                      category,
                      getSectionProvider(categoryProviders, categoryConfigs, category),
                      categoryConfigs[category] || '',
                      categoryFallbacks[category] || '',
                      v => setCategoryProvider(category, v),
                      v => setCategoryModel(category, v),
                      v => setCategoryFallbacks(prev => ({ ...prev, [category]: v }))
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          <datalist id="available-models">
            {allAvailableModels.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden border-t lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-6 py-3">
            <span className="flex flex-wrap items-center gap-2 font-mono text-sm font-medium">
              {activeTab === 'opencode' ? 'opencode.json' : 'oh-my-opencode.json'}
              {editingTab === activeTab && !jsonError && (
                <Badge variant="secondary" className="text-[10px]">edited</Badge>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  validation.valid
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive'
                )}
                title={validation.message}
              >
                {validation.valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {validation.valid ? 'Valid' : 'Invalid'}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                copied && 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white'
              )}
              onClick={() => copyToClipboard(previewValue)}
            >
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden" onBlur={handlePreviewBlur}>
            <JsonPreview
              value={previewValue}
              onChange={handlePreviewChange}
              error={jsonError || (!validation.valid ? validation.message : null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
