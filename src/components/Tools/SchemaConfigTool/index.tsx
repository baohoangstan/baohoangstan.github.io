import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, RotateCcw, Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@site/src/lib/utils';
import { Button } from '@site/src/components/ui/button';
import { Badge } from '@site/src/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@site/src/components/ui/tabs';
import { SchemaConfigProvider, useSchemaConfig, type SchemaTab } from './shared/context';
import { JsonPreview } from './shared/JsonPreview';
import { parseJsonc } from './shared/jsonc';
import { validateOpencodeSchema, validateOmoSchema } from './shared/validators';
import { buildOpencodeJson, hydrateOpencodeState } from './shared/opencode';
import { buildOmoJson, hydrateOmoState } from './shared/omo';
import type { ValidationResult } from './shared/types';
import DefaultPage from './pages/DefaultPage';
import OpencodePage from './pages/OpencodePage';
import OmoPage from './pages/OmoPage';

const TAB_META: Record<SchemaTab, { label: string; fileName: string }> = {
  default: { label: 'Default', fileName: 'schema.json' },
  opencode: { label: 'Opencode Config', fileName: 'opencode.json' },
  omo: { label: 'Oh My Opencode', fileName: 'oh-my-opencode.json' },
};

function SchemaConfigInner() {
  const ctx = useSchemaConfig();
  const {
    activeTab,
    setActiveTab,
    providersData,
    configuredProviders,
    setConfiguredProviders,
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
    defaultSchemaText,
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

  // Generated JSON per tab.
  const opencodeJson = useMemo(
    () => buildOpencodeJson({ configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData }),
    [configuredProviders, defaultModel, smallModel, modelLimitOverrides, modelNameOverrides, providersData]
  );
  const omoJson = useMemo(
    () => buildOmoJson({ agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks }),
    [agentConfigs, agentFallbacks, categoryConfigs, categoryFallbacks]
  );
  const defaultJson = useMemo(
    () => JSON.stringify(defaultFormData ?? {}, null, 2),
    [defaultFormData]
  );

  const generatedJson = activeTab === 'opencode' ? opencodeJson : activeTab === 'omo' ? omoJson : defaultJson;

  // Draft editing of the preview: show raw draft; valid JSON syncs back to form state.
  const [draft, setDraft] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<SchemaTab | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const previewValue = editingTab === activeTab && draft !== null ? draft : generatedJson;

  const validation = useMemo<ValidationResult>(() => {
    let parsed: unknown;
    try {
      parsed = parseJsonc(previewValue);
    } catch (e) {
      return { valid: false, message: (e as Error).message };
    }
    if (activeTab === 'opencode') return validateOpencodeSchema(parsed);
    if (activeTab === 'omo') return validateOmoSchema(parsed);
    return { valid: true, message: 'Valid JSON.' };
  }, [previewValue, activeTab]);

  useEffect(() => {
    setDraft(null);
    setEditingTab(null);
    setJsonError(null);
  }, [activeTab]);

  const applyHydration = (parsed: any) => {
    if (activeTab === 'opencode') hydrateOpencodeState(parsed, opencodeHydrateSetters);
    else if (activeTab === 'omo') hydrateOmoState(parsed, omoHydrateSetters);
    else setDefaultFormData(parsed);
  };

  const handlePreviewChange = (next: string) => {
    setDraft(next);
    setEditingTab(activeTab);
    try {
      const parsed = parseJsonc(next);
      applyHydration(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handlePreviewBlur = () => {
    if (!jsonError) {
      setDraft(null);
      setEditingTab(null);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      try {
        if (activeTab === 'default') {
          // Importing a schema file for the generic form.
          parseJsonc(raw);
          setDefaultSchemaText(raw);
          setDefaultFormData({});
        } else {
          const json = parseJsonc(raw);
          if (activeTab === 'opencode') hydrateOpencodeState(json, opencodeHydrateSetters);
          else hydrateOmoState(json, omoHydrateSetters);
        }
      } catch {
        alert('Invalid JSON/JSONC file.');
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
    activeTab === 'default'
      ? 'Import a JSON Schema'
      : activeTab === 'opencode'
        ? 'Import existing opencode.json(c)'
        : 'Import existing oh-my-opencode.json(c)';

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-xl font-semibold">Configuration Generator</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} title={importTitle}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll} title="Reset all configuration to defaults">
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as SchemaTab)}>
            <TabsList>
              <TabsTrigger value="default">Default</TabsTrigger>
              <TabsTrigger value="opencode">Opencode Config</TabsTrigger>
              <TabsTrigger value="omo">Oh My Opencode</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto border-b p-6 lg:border-b-0 lg:border-r">
          {activeTab === 'default' && <DefaultPage />}
          {activeTab === 'opencode' && <OpencodePage />}
          {activeTab === 'omo' && <OmoPage />}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden border-t lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-6 py-3">
            <span className="flex flex-wrap items-center gap-2 font-mono text-sm font-medium">
              {TAB_META[activeTab].fileName}
              {editingTab === activeTab && !jsonError && (
                <Badge variant="secondary" className="text-[10px]">edited</Badge>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  validation.valid
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive'
                )}
                title={validation.message}
              >
                {validation.valid ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {validation.valid ? 'Valid' : 'Invalid'}
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

export default function SchemaConfigTool() {
  return (
    <SchemaConfigProvider>
      <SchemaConfigInner />
    </SchemaConfigProvider>
  );
}
