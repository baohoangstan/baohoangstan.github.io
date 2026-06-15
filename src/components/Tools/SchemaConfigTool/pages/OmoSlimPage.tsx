import React, { useMemo } from 'react';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { MultiSelect } from '@site/src/components/ui/multi-select';
import { useSchemaConfig } from '../shared/context';
import {
  OMOSLIM_AGENTS,
  OMOSLIM_VARIANTS,
  OMOSLIM_SKILLS,
  OMOSLIM_MCPS,
} from '../shared/constants';
import type { OmoSlimAgentConfig } from '../shared/types';

const fieldInput =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export default function OmoSlimPage() {
  const {
    providersData,
    configuredProviders,
    omoslimPreset,
    setOmoslimPreset,
    omoslimAgents,
    setOmoslimAgents,
  } = useSchemaConfig();

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
    setOmoslimAgents(prev => ({ ...prev, [agent]: { ...prev[agent], ...patch } }));
  };

  const skillOptions = useMemo(() => OMOSLIM_SKILLS.map(s => ({ value: s })), []);
  const mcpOptions = useMemo(() => OMOSLIM_MCPS.map(m => ({ value: m })), []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Preset</h3>
        <div className="flex flex-col gap-1.5 sm:max-w-xs">
          <Label>Active preset name</Label>
          <Input
            className="font-mono text-sm"
            placeholder="e.g. openai"
            value={omoslimPreset}
            onChange={e => setOmoslimPreset(e.target.value)}
          />
          <p className="m-0 text-xs text-muted-foreground">
            Agents below are written under <span className="font-mono">presets.{omoslimPreset || 'openai'}</span> and
            activated via the top-level <span className="font-mono">preset</span> field.
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Agents</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {OMOSLIM_AGENTS.map(agent => {
            const cfg = omoslimAgents[agent] || {};
            return (
              <div key={agent} className="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
                <Label className="capitalize">{agent}</Label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Model</span>
                  <input
                    className={fieldInput}
                    list="omoslim-models"
                    value={cfg.model || ''}
                    onChange={e => updateAgent(agent, { model: e.target.value })}
                    placeholder="provider/model"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Variant</span>
                  <input
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
