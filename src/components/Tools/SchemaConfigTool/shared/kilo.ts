// --- Kilo CLI (kilo.json / kilo.jsonc) JSON generation + hydration ---
import { DEFAULT_KILO_CONFIG, KILO_PERMISSION_TOOLS, KILO_SCHEMA_URL } from './constants';
import type { KiloConfig, KiloPermissionAction, KiloTri } from './types';

function triToBool(v: KiloTri): boolean | undefined {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

function boolToTri(v: unknown): KiloTri {
  if (v === true) return 'true';
  if (v === false) return 'false';
  return '';
}

function cleanList(list: string[]): string[] {
  return list.map(s => s.trim()).filter(Boolean);
}

function stringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function buildKiloJson(cfg: KiloConfig): string {
  const out: any = { $schema: KILO_SCHEMA_URL };

  if (cfg.model.trim()) out.model = cfg.model.trim();
  if (cfg.small_model.trim()) out.small_model = cfg.small_model.trim();
  if (cfg.default_agent.trim()) out.default_agent = cfg.default_agent.trim();
  if (cfg.username.trim()) out.username = cfg.username.trim();
  if (cfg.share) out.share = cfg.share;

  if (cfg.autoupdate === 'notify') out.autoupdate = 'notify';
  else {
    const b = triToBool(cfg.autoupdate as KiloTri);
    if (b !== undefined) out.autoupdate = b;
  }

  const snapshot = triToBool(cfg.snapshot);
  if (snapshot !== undefined) out.snapshot = snapshot;

  const instructions = cleanList(cfg.instructions);
  if (instructions.length) out.instructions = instructions;
  const plugin = cleanList(cfg.plugin);
  if (plugin.length) out.plugin = plugin;

  const compaction: any = {};
  const auto = triToBool(cfg.compactionAuto);
  const prune = triToBool(cfg.compactionPrune);
  if (auto !== undefined) compaction.auto = auto;
  if (prune !== undefined) compaction.prune = prune;
  if (Object.keys(compaction).length) out.compaction = compaction;

  const skills: any = {};
  const paths = cleanList(cfg.skillPaths);
  const urls = cleanList(cfg.skillUrls);
  if (paths.length) skills.paths = paths;
  if (urls.length) skills.urls = urls;
  if (Object.keys(skills).length) out.skills = skills;

  const disabled = cleanList(cfg.disabledProviders);
  if (disabled.length) out.disabled_providers = disabled;
  const enabled = cleanList(cfg.enabledProviders);
  if (enabled.length) out.enabled_providers = enabled;

  const permission: any = { ...cfg.extraPermissions };
  Object.entries(cfg.permissions).forEach(([tool, action]) => {
    if (action) permission[tool] = action;
  });
  if (Object.keys(permission).length) out.permission = permission;

  return JSON.stringify(out, null, 2);
}

export type KiloHydrateSetters = {
  setKiloConfig: (v: KiloConfig) => void;
};

export function hydrateKiloState(json: any, setters: KiloHydrateSetters) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return;

  const next: KiloConfig = {
    ...DEFAULT_KILO_CONFIG,
    permissions: { ...DEFAULT_KILO_CONFIG.permissions },
    extraPermissions: {},
  };

  if (typeof json.model === 'string') next.model = json.model;
  if (typeof json.small_model === 'string') next.small_model = json.small_model;
  if (typeof json.default_agent === 'string') next.default_agent = json.default_agent;
  if (typeof json.username === 'string') next.username = json.username;
  if (json.share === 'manual' || json.share === 'auto' || json.share === 'disabled') next.share = json.share;

  if (json.autoupdate === 'notify') next.autoupdate = 'notify';
  else if (json.autoupdate === true) next.autoupdate = 'true';
  else if (json.autoupdate === false) next.autoupdate = 'false';

  next.snapshot = boolToTri(json.snapshot);

  if (json.compaction && typeof json.compaction === 'object') {
    next.compactionAuto = boolToTri(json.compaction.auto);
    next.compactionPrune = boolToTri(json.compaction.prune);
  }

  next.instructions = stringArray(json.instructions);
  next.plugin = stringArray(json.plugin);

  if (json.skills && typeof json.skills === 'object') {
    next.skillPaths = stringArray(json.skills.paths);
    next.skillUrls = stringArray(json.skills.urls);
  }

  next.disabledProviders = stringArray(json.disabled_providers);
  next.enabledProviders = stringArray(json.enabled_providers);

  if (json.permission && typeof json.permission === 'object' && !Array.isArray(json.permission)) {
    const extra: Record<string, unknown> = {};
    for (const [tool, action] of Object.entries(json.permission)) {
      const isKnownScalar =
        KILO_PERMISSION_TOOLS.includes(tool) &&
        (action === 'allow' || action === 'ask' || action === 'deny');
      if (isKnownScalar) {
        next.permissions[tool] = action as KiloPermissionAction;
      } else {
        // Object/glob-form values, MCP tool patterns, and tools not surfaced
        // in the scalar form are preserved verbatim.
        extra[tool] = action;
      }
    }
    next.extraPermissions = extra;
  }

  setters.setKiloConfig(next);
}
