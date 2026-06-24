// --- Schema version/date discovery for the config tabs ---
import { KILO_SCHEMA_URL, OMOSLIM_NPM_PACKAGE } from './constants';

export type SchemaMeta = {
  version?: string;
  /** Raw ISO string or HTTP date; format with formatSchemaDate before display. */
  date?: string;
  /** Human label for where the metadata came from (npm, app.kilo.ai, …). */
  source?: string;
};

export function extractSchemaVersion(schema: unknown): string | undefined {
  if (!schema || typeof schema !== 'object') return undefined;
  const obj = schema as Record<string, unknown>;

  if (typeof obj.version === 'string' && obj.version.trim()) return obj.version.trim();
  if (typeof obj.version === 'number') return String(obj.version);

  const id = typeof obj.$id === 'string' ? obj.$id : '';
  const fromId = id.match(/v?(\d+\.\d+(?:\.\d+)?)/);
  if (fromId) return fromId[1];

  return undefined;
}

export function formatSchemaDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function fetchOmoslimMeta(): Promise<SchemaMeta> {
  const res = await fetch(`https://registry.npmjs.org/${OMOSLIM_NPM_PACKAGE}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    'dist-tags'?: Record<string, string>;
    time?: Record<string, string>;
  };
  const version = data['dist-tags']?.latest;
  const date = (version ? data.time?.[version] : undefined) ?? data.time?.modified;
  return { version, date, source: 'npm' };
}

export async function fetchKiloMeta(): Promise<SchemaMeta> {
  const res = await fetch(KILO_SCHEMA_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const date = res.headers.get('last-modified') ?? undefined;
  let version: string | undefined;
  try {
    version = extractSchemaVersion(await res.json());
  } catch {
    /* body isn't JSON or lacks a version — date alone is still useful */
  }
  return { version, date, source: 'app.kilo.ai' };
}
