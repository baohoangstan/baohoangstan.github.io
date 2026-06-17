import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Upload, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@site/src/components/ui/button';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
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
  OMOSLIM_AGENTS,
  OMOSLIM_VARIANTS,
  OMOSLIM_SKILLS,
  OMOSLIM_MCPS,
  fieldInput,
} from '../shared/constants';
import { parseJsonc } from '../shared/jsonc';
import { hydrateOpencodeState } from '../shared/opencode';
import { loadPersisted } from '../shared/persistence';
import type { OmoSlimAgentConfig } from '../shared/types';

export default function OmoSlimPage() {
  const {
    providersData,
    configuredProviders,
    setConfiguredProviders,
    setDefaultModel,
    setSmallModel,
    setModelInputs,
    setModelLimitOverrides,
    setModelNameOverrides,
    omoslimPresets,
    setOmoslimPresets,
    omoslimDefaultPreset,
    setOmoslimDefaultPreset,
  } = useSchemaConfig();

  const opencodeImportRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const presetNames = useMemo(() => Object.keys(omoslimPresets), [omoslimPresets]);

  // Which preset's agents are shown/edited below (UI-only state).
  const [editPreset, setEditPreset] = useState<string>(
    () => omoslimDefaultPreset || presetNames[0] || ''
  );
  const [newPresetName, setNewPresetName] = useState('');

  // Keep edit/default selections pointed at a preset that still exists.
  useEffect(() => {
    if (presetNames.length === 0) return;
    if (!presetNames.includes(editPreset)) setEditPreset(presetNames[0]);
    if (!presetNames.includes(omoslimDefaultPreset)) setOmoslimDefaultPreset(presetNames[0]);
  }, [presetNames, editPreset, omoslimDefaultPreset, setOmoslimDefaultPreset]);

  const currentAgents = omoslimPresets[editPreset] || {};

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

  const updateAgent = (agent: string, patch: Partial<OmoSlimAgentConfig>) => {
    setOmoslimPresets(prev => {
      const preset = prev[editPreset] || {};
      return {
        ...prev,
        [editPreset]: { ...preset, [agent]: { ...preset[agent], ...patch } },
      };
    });
  };

  const addPreset = () => {
    const name = newPresetName.trim();
    if (!name || omoslimPresets[name]) return;
    setOmoslimPresets(prev => ({ ...prev, [name]: {} }));
    setEditPreset(name);
    setNewPresetName('');
  };

  const removePreset = (name: string) => {
    if (presetNames.length <= 1) return;
    setOmoslimPresets(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
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
        setImportError(null);
      } catch {
        setImportError('Invalid JSON/JSONC file.');
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
      setImportError(null);
    } else if (typeof window !== 'undefined') {
      setImportError('No saved opencode config found in this browser.');
    }
  };

  const skillOptions = useMemo(() => OMOSLIM_SKILLS.map(s => ({ value: s })), []);
  const mcpOptions = useMemo(() => OMOSLIM_MCPS.map(m => ({ value: m })), []);

  const providerCount = Object.values(configuredProviders).filter(c => c.enabled).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4">
        <div className="flex flex-col gap-0.5 border-b pb-2">
          <h3 className="m-0 text-lg font-semibold">Provider source</h3>
          <span className="text-xs text-muted-foreground">
            {providerCount
              ? `${providerCount} provider(s) available — used to suggest models below.`
              : 'No providers yet. Import an opencode.json or load your saved config.'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setImportError(null); opencodeImportRef.current?.click(); }}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import providers from opencode.json
          </Button>
          <Button variant="outline" size="sm" onClick={loadSavedOpencode}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Load saved provider config
          </Button>
          <input
            ref={opencodeImportRef}
            type="file"
            accept=".json,.jsonc,application/json"
            className="hidden"
            onChange={handleImportOpencodeFile}
          />
        </div>
        {importError && (
          <p className="m-0 flex items-center gap-1.5 text-xs text-destructive dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {importError}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Presets</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Default preset</Label>
            <Select
              value={presetNames.includes(omoslimDefaultPreset) ? omoslimDefaultPreset : ''}
              onValueChange={setOmoslimDefaultPreset}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select preset…" />
              </SelectTrigger>
              <SelectContent>
                {presetNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="m-0 text-xs text-muted-foreground">
              Written to the top-level <span className="font-mono">preset</span> field.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Editing preset</Label>
            <div className="flex items-center gap-2">
              <Select
                value={presetNames.includes(editPreset) ? editPreset : ''}
                onValueChange={setEditPreset}
              >
                <SelectTrigger className="h-9 flex-1 text-sm">
                  <SelectValue placeholder="Select preset…" />
                </SelectTrigger>
                <SelectContent>
                  {presetNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removePreset(editPreset)}
                disabled={presetNames.length <= 1}
                title="Delete this preset"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              Agents below apply to <span className="font-mono">presets.{editPreset || '…'}</span>.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="omoslim-add-preset">Add preset</Label>
            <div className="flex items-center gap-2">
              <Input
                id="omoslim-add-preset"
                className="h-9 flex-1 font-mono text-sm"
                placeholder="e.g. anthropic"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPreset(); } }}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={addPreset}
                disabled={!newPresetName.trim() || !!omoslimPresets[newPresetName.trim()]}
                title="Add preset"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              Create a new named preset and start editing it.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">
          Agents <span className="font-mono text-sm font-normal text-muted-foreground">· {editPreset}</span>
        </h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {OMOSLIM_AGENTS.map(agent => {
            const cfg = currentAgents[agent] || {};
            return (
              <div key={agent} className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
                <Label className="capitalize">{agent}</Label>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`omoslim-${agent}-model`} className="text-xs font-semibold text-muted-foreground">Model</label>
                  <input
                    id={`omoslim-${agent}-model`}
                    className={fieldInput}
                    list="omoslim-models"
                    value={cfg.model || ''}
                    onChange={e => updateAgent(agent, { model: e.target.value })}
                    placeholder="provider/model"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`omoslim-${agent}-variant`} className="text-xs font-semibold text-muted-foreground">Variant</label>
                  <input
                    id={`omoslim-${agent}-variant`}
                    className={fieldInput}
                    list="omoslim-variants"
                    value={cfg.variant || ''}
                    onChange={e => updateAgent(agent, { variant: e.target.value })}
                    placeholder="low / medium / high"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Skills</span>
                  <MultiSelect
                    options={skillOptions}
                    selected={cfg.skills || []}
                    onChange={next => updateAgent(agent, { skills: next })}
                    placeholder="Add skills…"
                    searchPlaceholder="Search or type a skill…"
                    emptyText="Type a skill to add"
                    allowCustom
                  />
                  <p className="m-0 text-xs text-muted-foreground">
                    Use <span className="font-mono">*</span> for all, <span className="font-mono">!name</span> to exclude.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">MCPs</span>
                  <MultiSelect
                    options={mcpOptions}
                    selected={cfg.mcps || []}
                    onChange={next => updateAgent(agent, { mcps: next })}
                    placeholder="Add MCPs…"
                    searchPlaceholder="Search or type an MCP…"
                    emptyText="Type an MCP to add"
                    allowCustom
                  />
                  <p className="m-0 text-xs text-muted-foreground">
                    Use <span className="font-mono">*</span> for all, <span className="font-mono">!name</span> to exclude.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <datalist id="omoslim-models">
        {allAvailableModels.map(m => <option key={m} value={m} />)}
      </datalist>
      <datalist id="omoslim-variants">
        {OMOSLIM_VARIANTS.map(v => <option key={v} value={v} />)}
      </datalist>
    </div>
  );
}
