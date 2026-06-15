// --- Oh My Opencode Slim JSON generation + hydration ---
import { OMOSLIM_SCHEMA_URL, DEFAULT_OMOSLIM_PRESET } from './constants';
import type { OmoSlimAgentConfig } from './types';

export function buildOmoSlimJson(args: {
  preset: string;
  agents: Record<string, OmoSlimAgentConfig>;
}): string {
  const { preset, agents } = args;

  const agentsOut: Record<string, any> = {};
  Object.entries(agents).forEach(([id, cfg]) => {
    const entry: any = {};
    if (cfg.model && cfg.model.trim()) entry.model = cfg.model.trim();
    if (cfg.variant && cfg.variant.trim()) entry.variant = cfg.variant.trim();
    if (cfg.skills && cfg.skills.length > 0) entry.skills = cfg.skills;
    if (cfg.mcps && cfg.mcps.length > 0) entry.mcps = cfg.mcps;
    if (Object.keys(entry).length > 0) agentsOut[id] = entry;
  });

  const presetName = preset.trim() || DEFAULT_OMOSLIM_PRESET;

  return JSON.stringify(
    {
      $schema: OMOSLIM_SCHEMA_URL,
      preset: presetName,
      presets: { [presetName]: agentsOut },
    },
    null,
    2
  );
}

export type OmoSlimHydrateSetters = {
  setOmoslimPreset: (v: string) => void;
  setOmoslimAgents: (v: Record<string, OmoSlimAgentConfig>) => void;
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
  if (preset) setters.setOmoslimPreset(preset);

  let agentsObj: any;
  if (json?.presets && typeof json.presets === 'object') {
    agentsObj = (preset && json.presets[preset]) || Object.values(json.presets)[0];
  }
  if (!agentsObj && json?.agents && typeof json.agents === 'object') {
    agentsObj = json.agents;
  }
  if (agentsObj && typeof agentsObj === 'object') {
    setters.setOmoslimAgents(readAgentMap(agentsObj));
  }
}
