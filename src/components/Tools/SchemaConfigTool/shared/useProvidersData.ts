import { useEffect, useState } from 'react';
import { DEFAULT_PROVIDERS } from './constants';
import type { Provider } from './types';

/**
 * Fetches the provider/model catalog from models.dev, merged on top of the
 * built-in DEFAULT_PROVIDERS. Falls back to defaults on any failure.
 */
export function useProvidersData() {
  const [providersData, setProvidersData] = useState<Record<string, Provider>>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://models.dev/api.json');
        if (response.ok) {
          const data = await response.json();
          const parsedProviders: Record<string, Provider> = {};

          for (const [key, val] of Object.entries(data)) {
            const typedVal = val as any;
            const modelLimits: Record<string, { context?: number; output?: number }> = {};
            const modelNames: Record<string, string> = {};
            if (typedVal.models) {
              for (const [modelId, modelData] of Object.entries(typedVal.models)) {
                const md = modelData as any;
                if (md?.limit) {
                  modelLimits[modelId] = {
                    context: md.limit.context,
                    output: md.limit.output,
                  };
                }
                if (md?.name) modelNames[modelId] = md.name;
              }
            }
            parsedProviders[key] = {
              id: typedVal.id || key,
              name: typedVal.name || key,
              api: typedVal.api || '',
              doc: typedVal.doc || '',
              env: typedVal.env || [],
              models: typedVal.models ? Object.keys(typedVal.models) : [],
              modelLimits,
              modelNames,
            };
          }

          setProvidersData({ ...DEFAULT_PROVIDERS, ...parsedProviders });
        }
      } catch (err) {
        console.warn('Failed to fetch models.dev, falling back to defaults', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  return { providersData, loading };
}
