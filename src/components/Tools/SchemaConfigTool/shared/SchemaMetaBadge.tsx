import React from 'react';
import { FileClock, Loader2 } from 'lucide-react';
import { useSchemaMeta } from './useSchemaMeta';
import { formatSchemaDate } from './schemaMeta';
import type { SchemaTab } from './context';

export function SchemaMetaBadge({ tab }: { tab: SchemaTab }) {
  const { loading, meta } = useSchemaMeta(tab);

  if (loading) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        Loading schema info…
      </span>
    );
  }

  if (!meta) return null;

  const rawVersion = meta.version?.trim();
  const version = rawVersion ? (/^\d/.test(rawVersion) ? `v${rawVersion}` : rawVersion) : undefined;
  const date = formatSchemaDate(meta.date);
  if (!version && !date) return null;

  return (
    <span
      className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      title={meta.source ? `Schema info from ${meta.source}` : undefined}
    >
      <FileClock className="h-3 w-3 shrink-0" />
      <span>Schema</span>
      {version && <span className="font-mono font-medium text-foreground">{version}</span>}
      {version && date && <span aria-hidden>·</span>}
      {date && <span>{date}</span>}
    </span>
  );
}
