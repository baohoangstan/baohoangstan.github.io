// --- Oh-my-opencode JSON generation + hydration ---

export function buildOmoJson(args: {
  agentConfigs: Record<string, string>;
  agentFallbacks: Record<string, string>;
  categoryConfigs: Record<string, string>;
  categoryFallbacks: Record<string, string>;
}): string {
  const { agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks } = args;

  const parseFallbacks = (raw: string): string[] =>
    raw
      .split(',')
      .map(s => s.trim())
      .filter(s => s && !s.endsWith('/'));

  const agents: any = {};
  Object.entries(agentConfigs).forEach(([id, model]) => {
    if (!model) return;
    const fallbacks = parseFallbacks(agentFallbacks[id] || '');
    agents[id] = {
      model,
      ...(fallbacks.length > 0 && { fallback_models: fallbacks }),
    };
  });

  const categories: any = {};
  Object.entries(categoryConfigs).forEach(([id, model]) => {
    if (!model) return;
    const fallbacks = parseFallbacks(categoryFallbacks[id] || '');
    categories[id] = {
      model,
      ...(fallbacks.length > 0 && { fallback_models: fallbacks }),
    };
  });

  return JSON.stringify({
    $schema: 'https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json',
    agents,
    categories,
  }, null, 2);
}

export type OmoHydrateSetters = {
  setAgentConfigs: (v: Record<string, string>) => void;
  setAgentFallbacks: (v: Record<string, string>) => void;
  setCategoryConfigs: (v: Record<string, string>) => void;
  setCategoryFallbacks: (v: Record<string, string>) => void;
};

export function hydrateOmoState(json: any, setters: OmoHydrateSetters) {
  if (json.agents) {
    const newAgents: Record<string, string> = {};
    const newFallbacks: Record<string, string> = {};
    for (const [id, cfg] of Object.entries(json.agents)) {
      const c = cfg as any;
      if (c.model) newAgents[id] = c.model;
      if (Array.isArray(c.fallback_models))
        newFallbacks[id] = c.fallback_models
          .map((f: any) => (typeof f === 'string' ? f : f?.model))
          .filter(Boolean)
          .join(', ');
    }
    setters.setAgentConfigs(newAgents);
    setters.setAgentFallbacks(newFallbacks);
  }
  if (json.categories) {
    const newCats: Record<string, string> = {};
    const newCatFallbacks: Record<string, string> = {};
    for (const [id, cfg] of Object.entries(json.categories)) {
      const c = cfg as any;
      if (c.model) newCats[id] = c.model;
      if (Array.isArray(c.fallback_models))
        newCatFallbacks[id] = c.fallback_models
          .map((f: any) => (typeof f === 'string' ? f : f?.model))
          .filter(Boolean)
          .join(', ');
    }
    setters.setCategoryConfigs(newCats);
    setters.setCategoryFallbacks(newCatFallbacks);
  }
}
