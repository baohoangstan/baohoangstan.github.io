import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { withTheme } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { widgets } from './widgets';
import { templates } from './templates';

const ThemedForm = withTheme({ widgets, templates });

export type DynamicSchemaFormProps = {
  schema: RJSFSchema;
  formData?: unknown;
  onChange: (value: unknown) => void;
  uiSchema?: UiSchema;
};

export function DynamicSchemaForm(props: DynamicSchemaFormProps): JSX.Element {
  return (
    <BrowserOnly fallback={<div className="p-4 text-sm text-muted-foreground">Loading form…</div>}>
      {() => (
        <div className="rjsf-themed-form">
          <ThemedForm
            schema={props.schema}
            formData={props.formData}
            uiSchema={props.uiSchema}
            validator={validator}
            liveValidate
            showErrorList={false}
            onChange={(e) => props.onChange(e.formData)}
          />
        </div>
      )}
    </BrowserOnly>
  );
}
