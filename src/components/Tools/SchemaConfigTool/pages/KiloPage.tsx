import React, { useMemo } from 'react';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { MultiSelect } from '@site/src/components/ui/multi-select';
import { useSchemaConfig } from '../shared/context';
import { KILO_PERMISSION_TOOLS } from '../shared/constants';
import type { KiloConfig } from '../shared/types';

const fieldInput =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const fieldSelect =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

type Option = { value: string; label: string };

function SelectField({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <select className={fieldSelect} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="m-0 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const TRI_OPTIONS: Option[] = [
  { value: '', label: 'Default' },
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
];
const SHARE_OPTIONS: Option[] = [
  { value: '', label: 'Default' },
  { value: 'manual', label: 'manual' },
  { value: 'auto', label: 'auto' },
  { value: 'disabled', label: 'disabled' },
];
const AUTOUPDATE_OPTIONS: Option[] = [
  { value: '', label: 'Default' },
  { value: 'true', label: 'Enabled (true)' },
  { value: 'false', label: 'Disabled (false)' },
  { value: 'notify', label: 'notify' },
];
const PERMISSION_OPTIONS: Option[] = [
  { value: '', label: 'Default' },
  { value: 'allow', label: 'allow' },
  { value: 'ask', label: 'ask' },
  { value: 'deny', label: 'deny' },
];

export default function KiloPage() {
  const {
    providersData,
    configuredProviders,
    kiloConfig,
    setKiloConfig,
  } = useSchemaConfig();

  const set = <K extends keyof KiloConfig>(key: K, value: KiloConfig[K]) =>
    setKiloConfig(prev => ({ ...prev, [key]: value }));

  const setPermission = (tool: string, action: string) =>
    setKiloConfig(prev => ({ ...prev, permissions: { ...prev.permissions, [tool]: action as any } }));

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

  const providerOptions = useMemo(
    () =>
      Object.entries(providersData)
        .sort((a, b) => a[1].name.localeCompare(b[1].name))
        .map(([id, p]) => ({ value: id, label: p.name })),
    [providersData]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">General</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Default Model</Label>
            <input
              className={fieldInput}
              list="kilo-models"
              value={kiloConfig.model}
              onChange={e => set('model', e.target.value)}
              placeholder="provider/model"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Small Model</Label>
            <input
              className={fieldInput}
              list="kilo-models"
              value={kiloConfig.small_model}
              onChange={e => set('small_model', e.target.value)}
              placeholder="provider/model"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Default Agent</Label>
            <Input
              className="font-mono text-sm"
              value={kiloConfig.default_agent}
              onChange={e => set('default_agent', e.target.value)}
              placeholder="e.g. code"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Username</Label>
            <Input
              value={kiloConfig.username}
              onChange={e => set('username', e.target.value)}
              placeholder="Display name override"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Behavior</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            label="Share"
            value={kiloConfig.share}
            onChange={v => set('share', v as KiloConfig['share'])}
            options={SHARE_OPTIONS}
            hint="Session sharing mode."
          />
          <SelectField
            label="Auto-update"
            value={kiloConfig.autoupdate}
            onChange={v => set('autoupdate', v as KiloConfig['autoupdate'])}
            options={AUTOUPDATE_OPTIONS}
          />
          <SelectField
            label="Snapshot"
            value={kiloConfig.snapshot}
            onChange={v => set('snapshot', v as KiloConfig['snapshot'])}
            options={TRI_OPTIONS}
            hint="Enable git snapshots."
          />
          <SelectField
            label="Compaction · auto"
            value={kiloConfig.compactionAuto}
            onChange={v => set('compactionAuto', v as KiloConfig['compactionAuto'])}
            options={TRI_OPTIONS}
            hint="Auto-compact when context is full."
          />
          <SelectField
            label="Compaction · prune"
            value={kiloConfig.compactionPrune}
            onChange={v => set('compactionPrune', v as KiloConfig['compactionPrune'])}
            options={TRI_OPTIONS}
            hint="Prune old tool outputs."
          />
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Instructions & Plugins</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Instructions</Label>
            <MultiSelect
              options={[]}
              selected={kiloConfig.instructions}
              onChange={next => set('instructions', next)}
              placeholder="Add glob patterns…"
              searchPlaceholder="Type a glob pattern…"
              emptyText="Type a pattern to add"
              allowCustom
            />
            <p className="m-0 text-xs text-muted-foreground">
              Glob patterns for additional instruction files.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Plugins</Label>
            <MultiSelect
              options={[]}
              selected={kiloConfig.plugin}
              onChange={next => set('plugin', next)}
              placeholder="Add plugins…"
              searchPlaceholder="npm package or file:// path…"
              emptyText="Type a plugin to add"
              allowCustom
            />
            <p className="m-0 text-xs text-muted-foreground">
              npm packages or <span className="font-mono">file://</span> paths.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Skills</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Skill Paths</Label>
            <MultiSelect
              options={[]}
              selected={kiloConfig.skillPaths}
              onChange={next => set('skillPaths', next)}
              placeholder="Add directories…"
              searchPlaceholder="e.g. ./my-skills…"
              emptyText="Type a path to add"
              allowCustom
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Skill URLs</Label>
            <MultiSelect
              options={[]}
              selected={kiloConfig.skillUrls}
              onChange={next => set('skillUrls', next)}
              placeholder="Add URLs…"
              searchPlaceholder="https://…/.well-known/skills/…"
              emptyText="Type a URL to add"
              allowCustom
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Providers</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Disabled Providers</Label>
            <MultiSelect
              options={providerOptions}
              selected={kiloConfig.disabledProviders}
              onChange={next => set('disabledProviders', next)}
              placeholder="Select providers…"
              searchPlaceholder="Search or type a provider id…"
              emptyText="Type a provider id to add"
              allowCustom
            />
            <p className="m-0 text-xs text-muted-foreground">
              Remove specific providers from the auto-loaded set.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Enabled Providers</Label>
            <MultiSelect
              options={providerOptions}
              selected={kiloConfig.enabledProviders}
              onChange={next => set('enabledProviders', next)}
              placeholder="Select providers…"
              searchPlaceholder="Search or type a provider id…"
              emptyText="Type a provider id to add"
              allowCustom
            />
            <p className="m-0 text-xs text-muted-foreground">
              When set, ONLY these providers are enabled.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Permissions</h3>
        <p className="m-0 mb-4 text-xs text-muted-foreground">
          Scalar permission per tool. Leave as <span className="font-mono">Default</span> to omit. Use the JSON
          editor for pattern-based (glob) permissions.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {KILO_PERMISSION_TOOLS.map(tool => (
            <SelectField
              key={tool}
              label={tool}
              value={kiloConfig.permissions[tool] ?? ''}
              onChange={v => setPermission(tool, v)}
              options={PERMISSION_OPTIONS}
            />
          ))}
        </div>
      </div>

      <datalist id="kilo-models">
        {allAvailableModels.map(m => (
          <option key={m} value={m} />
        ))}
      </datalist>
    </div>
  );
}
