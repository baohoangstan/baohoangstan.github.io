import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, RotateCcw, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@site/src/lib/utils';
import { Button } from '@site/src/components/ui/button';
import { Badge } from '@site/src/components/ui/badge';
import { SchemaConfigProvider, useSchemaConfig, type SchemaTab } from './shared/context';
import { JsonPreview } from './shared/JsonPreview';
import { parseJsonc } from './shared/jsonc';
import { validateOpencodeSchema, validateOmoSchema, validateOmoSlimSchema, validateKiloSchema } from './shared/validators';
import { buildOpencodeJson, hydrateOpencodeState } from './shared/opencode';
import { buildOmoJson, hydrateOmoState } from './shared/omo';
import { buildOmoSlimJson, hydrateOmoSlimState } from './shared/omoSlim';
import { buildKiloJson, hydrateKiloState } from './shared/kilo';
import type { ValidationResult } from './shared/types';
import DefaultPage from './pages/DefaultPage';
import OpencodePage from './pages/OpencodePage';
import OmoPage from './pages/OmoPage';
import OmoSlimPage from './pages/OmoSlimPage';
import KiloPage from './pages/KiloPage';

const TAB_META: Record<SchemaTab, { label: string; fileName: string }> = {
  default: { label: 'General', fileName: 'schema.json' },
  opencode: { label: 'Opencode', fileName: 'opencode.json' },
  omo: { label: 'Oh My Opencode', fileName: 'oh-my-opencode.json' },
  omoslim: { label: 'Oh My Opencode Slim', fileName: 'oh-my-opencode-slim.json' },
  kilo: { label: 'Kilo Config', fileName: 'kilo.jsonc' },
};

type SchemaConfigToolProps = {
  /** Which config this page edits. Drives the JSON preview, filename, and validation. */
  tab: SchemaTab;
};

function SchemaConfigInner({ tab }: SchemaConfigToolProps) {
  const ctx = useSchemaConfig();
  const {
    providersData,
    setConfiguredProviders,
    configuredProviders,
    defaultModel,
    setDefaultModel,
    smallModel,
    setSmallModel,
    setModelInputs,
    modelLimitOverrides,
    setModelLimitOverrides,
    modelNameOverrides,
    setModelNameOverrides,
    agentConfigs,
    setAgentConfigs,
    agentFallbacks,
    setAgentFallbacks,
    categoryConfigs,
    setCategoryConfigs,
    categoryFallbacks,
    setCategoryFallbacks,
    omoslimPresets,
    setOmoslimPresets,
    omoslimDefaultPreset,
    setOmoslimDefaultPreset,
    kiloConfig,
    setKiloConfig,
    setDefaultSchemaText,
    defaultFormData,
    setDefaultFormData,
    resetAll,
  } = ctx;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const opencodeHydrateSetters = {
    providersData,
    setDefaultModel,
    setSmallModel,
    setConfiguredProviders,
    setModelInputs,
    setModelLimitOverrides,
    setModelNameOverrides,
  };
  const omoHydrateSetters = {
    setAgentConfigs,
    setAgentFallbacks,
    setCategoryConfigs,
    setCategoryFallbacks,
  };
  const omoSlimHydrateSetters = {
    setOmoslimPresets,
    setOmoslimDefaultPreset,
  };
  const kiloHydrateSetters = {
    setKiloConfig,
  };

  // Generated JSON for this page's config.
  const opencodeJson = useMemo(
    () => buildOpencodeJson({ configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData }),
    [configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData]
  );
  const omoJson = useMemo(
    () => buildOmoJson({ agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks }),
    [agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks]
  );
  const omoSlimJson = useMemo(
    () => buildOmoSlimJson({ defaultPreset: omoslimDefaultPreset, presets: omoslimPresets }),
    [omoslimDefaultPreset, omoslimPresets]
  );
  const kiloJson = useMemo(() => buildKiloJson(kiloConfig), [kiloConfig]);
  const defaultJson = useMemo(
    () => JSON.stringify(defaultFormData ?? {}, null, 2),
    [defaultFormData]
  );

  const generatedJson =
    tab === 'opencode' ? opencodeJson
      : tab === 'omo' ? omoJson
        : tab === 'omoslim' ? omoSlimJson
          : tab === 'kilo' ? kiloJson
            : defaultJson;

  // Draft editing of the preview: show raw draft; valid JSON syncs back to form state.
  const [draft, setDraft] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const previewValue = draft !== null ? draft : generatedJson;

  const validation = useMemo<ValidationResult>(() => {
    let parsed: unknown;
    try {
      parsed = parseJsonc(previewValue);
    } catch (e) {
      return { valid: false, message: (e as Error).message };
    }
    if (tab === 'opencode') return validateOpencodeSchema(parsed);
    if (tab === 'omo') return validateOmoSchema(parsed);
    if (tab === 'omoslim') return validateOmoSlimSchema(parsed);
    if (tab === 'kilo') return validateKiloSchema(parsed);
    return { valid: true, message: 'Valid JSON.' };
  }, [previewValue, tab]);

  const applyHydration = (parsed: any) => {
    if (tab === 'opencode') hydrateOpencodeState(parsed, opencodeHydrateSetters);
    else if (tab === 'omo') hydrateOmoState(parsed, omoHydrateSetters);
    else if (tab === 'omoslim') hydrateOmoSlimState(parsed, omoSlimHydrateSetters);
    else if (tab === 'kilo') hydrateKiloState(parsed, kiloHydrateSetters);
    else setDefaultFormData(parsed);
  };

  const handlePreviewChange = (next: string) => {
    setDraft(next);
    try {
      const parsed = parseJsonc(next);
      applyHydration(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handlePreviewBlur = () => {
    // Keep the user's draft (and the "edited" badge) when it diverges from the
    // generated JSON; only drop it once it matches the canonical output.
    if (draft !== null && draft === generatedJson) setDraft(null);
  };

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      try {
        if (tab === 'default') {
          // Importing a schema file for the generic form.
          parseJsonc(raw);
          setDefaultSchemaText(raw);
          setDefaultFormData({});
        } else {
          const json = parseJsonc(raw);
          if (tab === 'opencode') hydrateOpencodeState(json, opencodeHydrateSetters);
          else if (tab === 'omoslim') hydrateOmoSlimState(json, omoSlimHydrateSetters);
          else if (tab === 'kilo') hydrateKiloState(json, kiloHydrateSetters);
          else hydrateOmoState(json, omoHydrateSetters);
        }
        setImportError(null);
        setImportSuccess(true);
        window.setTimeout(() => setImportSuccess(false), 1500);
      } catch {
        setImportSuccess(false);
        setImportError('Invalid JSON/JSONC file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [copied, setCopied] = useState(false);
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const importTitle =
    tab === 'default'
      ? 'Import a JSON Schema'
      : tab === 'opencode'
        ? 'Import existing opencode.json(c)'
        : tab === 'omoslim'
          ? 'Import existing oh-my-opencode-slim.json(c)'
          : tab === 'kilo'
            ? 'Import existing kilo.json(c)'
            : 'Import existing oh-my-opencode.json(c)';

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-xl font-semibold">{TAB_META[tab].label}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {importError && (
            <p className="m-0 flex items-center gap-1.5 text-xs text-destructive dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {importError}
            </p>
          )}
          {importSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5 shrink-0" />
              Imported
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title={importTitle}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll} title="Reset all configuration (every tab) to defaults">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset all
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col xl:h-[min(80vh,720px)] xl:flex-row">
        <div className="min-w-0 flex-1 overflow-y-auto border-b p-6 xl:border-b-0 xl:border-r">
          {tab === 'default' && <DefaultPage />}
          {tab === 'opencode' && <OpencodePage />}
          {tab === 'omo' && <OmoPage />}
          {tab === 'omoslim' && <OmoSlimPage />}
          {tab === 'kilo' && <KiloPage />}
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-t xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-6 py-3">
            <span className="flex flex-wrap items-center gap-2 font-mono text-sm font-medium">
              {TAB_META[tab].fileName}
              {draft !== null && (
                <Badge variant="secondary" className="text-[10px]">edited</Badge>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  validation.valid
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive dark:text-red-400'
                )}
                title={validation.message}
              >
                {validation.valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {validation.valid ? 'Valid' : 'Invalid'}
              </span>
              <span className="font-sans text-xs font-normal text-muted-foreground">
                Editable — changes sync to the form
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                copied && 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white'
              )}
              onClick={() => copyToClipboard(previewValue)}
            >
              {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden" onBlur={handlePreviewBlur}>
            <JsonPreview
              value={previewValue}
              onChange={handlePreviewChange}
              error={jsonError || (!validation.valid ? validation.message : null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchemaConfigTool({ tab }: SchemaConfigToolProps) {
  return (
    <SchemaConfigProvider>
      <SchemaConfigInner tab={tab} />
    </SchemaConfigProvider>
  );
}
