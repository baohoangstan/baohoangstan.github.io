import React from 'react';
import Editor from 'react-simple-code-editor';
import { Highlight, themes, type PrismTheme } from 'prism-react-renderer';
import { useColorMode } from '@docusaurus/theme-common';
import { AlertCircle } from 'lucide-react';

type JsonPreviewProps = {
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
};

export function JsonPreview({ value, onChange, error }: JsonPreviewProps) {
  const { colorMode } = useColorMode();
  const theme: PrismTheme = colorMode === 'dark' ? themes.vsDark : themes.vsLight;
  const editorFont =
    'var(--ifm-font-family-monospace, ui-monospace, SFMono-Regular, Menlo, monospace)';

  const highlight = (code: string) => (
    <Highlight theme={theme} code={code} language="json">
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => {
            const { key: _lk, ...lineProps } = getLineProps({ line });
            return (
              <div key={i} {...lineProps}>
                {line.map((token, k) => {
                  const { key: _tk, ...tokenProps } = getTokenProps({ token });
                  return <span key={k} {...tokenProps} />;
                })}
              </div>
            );
          })}
        </>
      )}
    </Highlight>
  );

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: theme.plain.backgroundColor, color: theme.plain.color }}
    >
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlight}
        padding={20}
        spellCheck={false}
        textareaClassName="focus:outline-none"
        style={{
          fontFamily: editorFont,
          fontSize: 13,
          lineHeight: 1.6,
          minHeight: '100%',
          caretColor: theme.plain.color,
        }}
      />
      {error && (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-destructive/40 bg-destructive/15 px-4 py-2 text-xs text-destructive backdrop-blur">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
