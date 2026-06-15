import React from 'react';
import type {
  FieldTemplateProps,
  ObjectFieldTemplateProps,
  ArrayFieldTemplateProps,
  ArrayFieldItemTemplateProps,
} from '@rjsf/utils';
import { Button } from '@site/src/components/ui/button';
import { Label } from '@site/src/components/ui/label';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@site/src/lib/utils';

export function FieldTemplate(props: FieldTemplateProps) {
  const { id, classNames, label, help, required, description, errors, children, hidden } = props;

  if (hidden) {
    return <div className="hidden">{children}</div>;
  }

  return (
    <div className={cn('mb-3 flex flex-col gap-1.5', classNames)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {description && <div className="mb-1 text-xs text-muted-foreground">{description}</div>}
      {children}
      {errors && <div className="mt-1 text-xs text-destructive">{errors}</div>}
      {help && <div className="mt-1 text-xs text-muted-foreground">{help}</div>}
    </div>
  );
}

export function ObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { title, properties, description, onAddProperty, disabled, readonly, schema } = props;
  const canAddProperties =
    schema.additionalProperties !== undefined && schema.additionalProperties !== false;

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
      {title && <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>}
      {description && <p className="m-0 text-xs text-muted-foreground">{description}</p>}

      <div className="mt-2 flex flex-col gap-2">
        {properties.map(prop => (
          <div key={prop.name} className="flex-1">
            {prop.content}
          </div>
        ))}
      </div>

      {canAddProperties && (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onAddProperty}
            disabled={disabled || readonly}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Property
          </Button>
        </div>
      )}
    </div>
  );
}

export function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const { title, items, canAdd, onAddClick, disabled, readonly } = props;

  return (
    <div className="mb-3 flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
      {title && <h3 className="m-0 text-sm font-semibold text-foreground">{title}</h3>}

      <div className="mt-2 flex flex-col gap-3">{items}</div>

      {canAdd && (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onAddClick}
            disabled={disabled || readonly}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Item
          </Button>
        </div>
      )}
    </div>
  );
}

export function ArrayFieldItemTemplate(props: ArrayFieldItemTemplateProps) {
  const { children, hasToolbar, buttonsProps } = props;
  const {
    hasMoveUp,
    hasMoveDown,
    hasRemove,
    onMoveUpItem,
    onMoveDownItem,
    onRemoveItem,
    disabled,
    readonly,
  } = buttonsProps;

  return (
    <div className="flex items-start gap-2 rounded-md border bg-background/50 p-2">
      <div className="flex-1">{children}</div>

      {hasToolbar && (
        <div className="flex items-center gap-1">
          {hasMoveUp && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveUpItem}
              disabled={disabled || readonly}
              title="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
          {hasMoveDown && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveDownItem}
              disabled={disabled || readonly}
              title="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          {hasRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onRemoveItem}
              disabled={disabled || readonly}
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function SubmitButton() {
  return null;
}

export const templates = {
  FieldTemplate,
  ObjectFieldTemplate,
  ArrayFieldTemplate,
  ArrayFieldItemTemplate,
  ButtonTemplates: {
    SubmitButton,
  },
};
