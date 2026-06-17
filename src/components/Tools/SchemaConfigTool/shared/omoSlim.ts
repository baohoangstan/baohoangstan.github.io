// --- Oh My Opencode Slim JSON generation + hydration ---
import { OMOSLIM_SCHEMA_URL, DEFAULT_OMOSLIM_PRESET } from './constants';
import type { OmoSlimAgentConfig } from './types';

function cleanAgents(agents: Record<string, OmoSlimAgentConfig>): Record<string, any> {
  const out: Record<string, any> = {};
  Object.entries(agents).forEach(([id, cfg]) => {
    const entry: any = {};
    if (cfg.model && cfg.model.trim()) entry.model = cfg.model.trim();
    if (cfg.variant && cfg.variant.trim()) entry.variant = cfg.variant.trim();
    if (cfg.skills && cfg.skills.length > 0) entry.skills = cfg.skills;
    if (cfg.mcps && cfg.mcps.length > 0) entry.mcps = cfg.mcps;
    if (Object.keys(entry).length > 0) out[id] = entry;
  });
  return out;
}

export function buildOmoSlimJson(args: {
  defaultPreset: string;
  presets: Record<string, Record<string, OmoSlimAgentConfig>>;
}): string {
  const { defaultPreset, presets } = args;

  const presetsOut: Record<string, any> = {};
  Object.entries(presets).forEach(([name, agents]) => {
    const key = name.trim();
    if (!key) return;
    presetsOut[key] = cleanAgents(agents);
  });

  const names = Object.keys(presetsOut);
  const activePreset =
    (defaultPreset.trim() && presetsOut[defaultPreset.trim()] ? defaultPreset.trim() : names[0]) ||
    DEFAULT_OMOSLIM_PRESET;

  return JSON.stringify(
    {
      $schema: OMOSLIM_SCHEMA_URL,
      preset: activePreset,
      presets: presetsOut,
    },
    null,
    2
  );
}

export type OmoSlimHydrateSetters = {
  setOmoslimDefaultPreset: (v: string) => void;
  setOmoslimPresets: (v: Record<string, Record<string, OmoSlimAgentConfig>>) => void;
};

function readAgentMap(obj: any): Record<string, OmoSlimAgentConfig> {
  const next: Record<string, OmoSlimAgentConfig> = {};
  for (const [id, raw] of Object.entries(obj)) {
    const c = raw as any;
    if (typeof c !== 'object' || c === null) continue;
    const entry: OmoSlimAgentConfig = {};
    if (typeof c.model === 'string') {
      entry.model = c.model;
    } else if (Array.isArray(c.model) && c.model.length > 0) {
      const first = c.model[0];
      entry.model = typeof first === 'string' ? first : first?.id;
    }
    if (typeof c.variant === 'string') entry.variant = c.variant;
    if (Array.isArray(c.skills)) entry.skills = c.skills.filter((s: any) => typeof s === 'string');
    if (Array.isArray(c.mcps)) entry.mcps = c.mcps.filter((s: any) => typeof s === 'string');
    next[id] = entry;
  }
  return next;
}

export function hydrateOmoSlimState(json: any, setters: OmoSlimHydrateSetters) {
  const preset = typeof json?.preset === 'string' ? json.preset : '';

  const presets: Record<string, Record<string, OmoSlimAgentConfig>> = {};
  if (json?.presets && typeof json.presets === 'object') {
    for (const [name, agents] of Object.entries(json.presets)) {
      if (agents && typeof agents === 'object') presets[name] = readAgentMap(agents);
    }
  }
  // Back-compat: a flat top-level `agents` object becomes a single preset.
  if (Object.keys(presets).length === 0 && json?.agents && typeof json.agents === 'object') {
    presets[preset || DEFAULT_OMOSLIM_PRESET] = readAgentMap(json.agents);
  }

  if (Object.keys(presets).length === 0) return;
  setters.setOmoslimPresets(presets);

  const names = Object.keys(presets);
  setters.setOmoslimDefaultPreset(preset && presets[preset] ? preset : names[0]);
}
