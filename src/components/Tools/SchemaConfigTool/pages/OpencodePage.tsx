import React, { useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@site/src/lib/utils';
import { Button } from '@site/src/components/ui/button';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { Badge } from '@site/src/components/ui/badge';
import { MultiSelect } from '@site/src/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@site/src/components/ui/select';
import { useSchemaConfig } from '../shared/context';
import {
  DEFAULT_CUSTOM_API,
  DEFAULT_CUSTOM_KEY,
  DEFAULT_CUSTOM_NPM,
  AI_SDK_OPTIONS,
} from '../shared/constants';
import {
  getAutoModelName as resolveAutoModelName,
  getModelLimit as resolveModelLimit,
} from '../shared/opencode';
import type { ProviderConfig } from '../shared/types';

const fieldInput =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function OpencodePage() {
  const {
    providersData,
    loading,
    configuredProviders,
    setConfiguredProviders,
    defaultModel,
    setDefaultModel,
    smallModel,
    setSmallModel,
    setModelInputs,
    modelLimitOverrides,
    setModelLimitOverrides,
    modelNameOverrides,
    setModelNameOverrides,
  } = useSchemaConfig();

  const [providerToAdd, setProviderToAdd] = useState<string>('');
  const [fetchedModels, setFetchedModels] = useState<Record<string, string[]>>({});
  const [fetchStatus, setFetchStatus] = useState<Record<string, { loading: boolean; error?: string }>>({});

  const getModelLimit = (providerId: string, modelId: string, field: 'context' | 'output') =>
    resolveModelLimit(providersData, configuredProviders, providerId, modelId, field);
  const getAutoModelName = (providerId: string, modelId: string) =>
    resolveAutoModelName(providersData, configuredProviders, providerId, modelId);

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
      },
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
        [field]: value,
      },
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
      [key]: { ...prev[key], [field]: value },
    }));
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

  return (
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

      <datalist id="available-models">
        {allAvailableModels.map(m => <option key={m} value={m} />)}
      </datalist>
    </div>
  );
}
