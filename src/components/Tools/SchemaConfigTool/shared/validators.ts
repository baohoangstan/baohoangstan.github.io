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
