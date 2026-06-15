import React, { useMemo, useState } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { Button } from '@site/src/components/ui/button';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { useSchemaConfig } from '../shared/context';
import { parseJsonc } from '../shared/jsonc';
import { isPlainObject } from '../shared/validators';
import { DynamicSchemaForm } from '../core/DynamicSchemaForm';
import type { RJSFSchema } from '@rjsf/utils';

export default function DefaultPage() {
  const {
    defaultSchemaUrl,
    setDefaultSchemaUrl,
    defaultSchemaText,
    setDefaultSchemaText,
    defaultFormData,
    setDefaultFormData,
  } = useSchemaConfig();

  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { schema, parseError } = useMemo<{ schema: RJSFSchema | null; parseError: string | null }>(() => {
    const text = defaultSchemaText.trim();
    if (!text) return { schema: null, parseError: null };
    try {
      const parsed = parseJsonc(text);
      if (!isPlainObject(parsed)) return { schema: null, parseError: 'Schema root must be a JSON object.' };
      return { schema: parsed as RJSFSchema, parseError: null };
    } catch (e) {
      return { schema: null, parseError: (e as Error).message };
    }
  }, [defaultSchemaText]);

  const fetchSchema = async () => {
    const url = defaultSchemaUrl.trim();
    if (!url) {
      setFetchError('Enter a schema URL first.');
      return;
    }
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Validate it parses before storing.
      parseJsonc(text);
      setDefaultSchemaText(text);
      setDefaultFormData({});
    } catch (e) {
      setFetchError((e as Error).message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Schema source</h3>
        <div className="flex flex-col gap-1.5">
          <Label>Import schema from URL</Label>
          <div className="flex items-center gap-2">
            <Input
              className="flex-1 font-mono text-sm"
              placeholder="https://example.com/schema.json"
              value={defaultSchemaUrl}
              onChange={e => setDefaultSchemaUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  fetchSchema();
                }
              }}
            />
            <Button variant="outline" size="sm" disabled={fetching} onClick={fetchSchema}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {fetching ? 'Fetching…' : 'Load'}
            </Button>
          </div>
          {fetchError && (
            <p className="m-0 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Failed to load: {fetchError}
            </p>
          )}
          <p className="m-0 text-xs text-muted-foreground">
            Loads any JSON Schema and renders an editable form below. Remote <span className="font-mono">$ref</span>s should be pre-resolved.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label>Or paste a JSON Schema</Label>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder='{ "type": "object", "properties": { "name": { "type": "string" } } }'
            value={defaultSchemaText}
            onChange={e => setDefaultSchemaText(e.target.value)}
            spellCheck={false}
          />
          {parseError && (
            <p className="m-0 flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {parseError}
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-4 border-b pb-2 text-lg font-semibold">Form</h3>
        {schema ? (
          <DynamicSchemaForm
            schema={schema}
            formData={defaultFormData}
            onChange={setDefaultFormData}
          />
        ) : (
          <p className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Load or paste a JSON Schema above to generate a form.
          </p>
        )}
      </div>
    </div>
  );
}
