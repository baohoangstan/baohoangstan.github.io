import { useEffect, useMemo, useState } from 'react';
import { useSchemaConfig, type SchemaTab } from './context';
import { parseJsonc } from './jsonc';
import { extractSchemaVersion, fetchKiloMeta, fetchOmoslimMeta, type SchemaMeta } from './schemaMeta';

export type SchemaMetaState = {
  loading: boolean;
  meta: SchemaMeta | null;
};

const REMOTE_FETCHERS: Partial<Record<SchemaTab, () => Promise<SchemaMeta>>> = {
  omoslim: fetchOmoslimMeta,
  kilo: fetchKiloMeta,
};

export function useSchemaMeta(tab: SchemaTab): SchemaMetaState {
  const { defaultSchemaText, defaultSchemaDate } = useSchemaConfig();
  const [remote, setRemote] = useState<SchemaMetaState>({ loading: false, meta: null });

  useEffect(() => {
    const fetcher = REMOTE_FETCHERS[tab];
    if (!fetcher) {
      setRemote({ loading: false, meta: null });
      return;
    }
    let cancelled = false;
    setRemote({ loading: true, meta: null });
    fetcher()
      .then(meta => { if (!cancelled) setRemote({ loading: false, meta }); })
      .catch(() => { if (!cancelled) setRemote({ loading: false, meta: null }); });
    return () => { cancelled = true; };
  }, [tab]);

  const defaultMeta = useMemo<SchemaMeta | null>(() => {
    const text = defaultSchemaText.trim();
    let version: string | undefined;
    if (text) {
      try { version = extractSchemaVersion(parseJsonc(text)); } catch { /* invalid draft */ }
    }
    const date = defaultSchemaDate || undefined;
    if (!version && !date) return null;
    return { version, date, source: 'schema' };
  }, [defaultSchemaText, defaultSchemaDate]);

  if (tab === 'default') return { loading: false, meta: defaultMeta };
  return remote;
}
