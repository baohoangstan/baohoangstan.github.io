import React, { useMemo, useRef } from 'react';
import { RefreshCw, Upload, X } from 'lucide-react';
import { Button } from '@site/src/components/ui/button';
import { Label } from '@site/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@site/src/components/ui/select';
import { useSchemaConfig } from '../shared/context';
import { AGENTS, CATEGORIES } from '../shared/constants';
import { parseJsonc } from '../shared/jsonc';
import { hydrateOpencodeState } from '../shared/opencode';
import { loadPersisted } from '../shared/persistence';

export default function OmoPage() {
  const {
    providersData,
    configuredProviders,
    setConfiguredProviders,
    setDefaultModel,
    setSmallModel,
    setModelInputs,
    setModelLimitOverrides,
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
  } = useSchemaConfig();

  const opencodeImportRef = useRef<HTMLInputElement>(null);

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

  const providerOfEntry = (entry: string): string => {
    const slash = entry.indexOf('/');
    return slash === -1 ? '' : entry.slice(0, slash);
  };

  const hydrateSetters = {
    providersData,
    setDefaultModel,
    setSmallModel,
    setConfiguredProviders,
    setModelInputs,
    setModelLimitOverrides,
    setModelNameOverrides,
  };

  const handleImportOpencodeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = parseJsonc(ev.target?.result as string);
        hydrateOpencodeState(json, hydrateSetters);
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">Provider source</span>
          <span className="text-xs text-muted-foreground">
            {omoProviders.length
              ? `${omoProviders.length} provider(s) available — configured in the Opencode Config page.`
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
  );
}
