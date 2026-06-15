import type { ValidationResult } from './types';

export const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validateOpencodeSchema(root: unknown): ValidationResult {
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

export function validateOmoSchema(root: unknown): ValidationResult {
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

function validateOmoSlimAgentMap(map: Record<string, any>, path: string): ValidationResult | null {
  for (const [key, cfg] of Object.entries(map)) {
    if (!isPlainObject(cfg)) return { valid: false, message: `${path}.${key} must be an object.` };
    if (cfg.model !== undefined && typeof cfg.model !== 'string' && !Array.isArray(cfg.model))
      return { valid: false, message: `${path}.${key}.model must be a string or array.` };
    if (cfg.variant !== undefined && typeof cfg.variant !== 'string')
      return { valid: false, message: `${path}.${key}.variant must be a string.` };
    if (cfg.temperature !== undefined && typeof cfg.temperature !== 'number')
      return { valid: false, message: `${path}.${key}.temperature must be a number.` };
    if (cfg.skills !== undefined && !Array.isArray(cfg.skills))
      return { valid: false, message: `${path}.${key}.skills must be an array.` };
    if (cfg.mcps !== undefined && !Array.isArray(cfg.mcps))
      return { valid: false, message: `${path}.${key}.mcps must be an array.` };
  }
  return null;
}

export function validateOmoSlimSchema(root: unknown): ValidationResult {
  if (!isPlainObject(root)) return { valid: false, message: 'Root must be an object.' };
  if (root.preset !== undefined && typeof root.preset !== 'string')
    return { valid: false, message: '"preset" must be a string.' };
  if (root.agents !== undefined) {
    if (!isPlainObject(root.agents)) return { valid: false, message: '"agents" must be an object.' };
    const err = validateOmoSlimAgentMap(root.agents, 'agents');
    if (err) return err;
  }
  if (root.presets !== undefined) {
    if (!isPlainObject(root.presets)) return { valid: false, message: '"presets" must be an object.' };
    for (const [name, preset] of Object.entries(root.presets)) {
      if (!isPlainObject(preset)) return { valid: false, message: `presets.${name} must be an object.` };
      const err = validateOmoSlimAgentMap(preset, `presets.${name}`);
      if (err) return err;
    }
  }
  return { valid: true, message: 'Matches oh-my-opencode-slim schema.' };
}
