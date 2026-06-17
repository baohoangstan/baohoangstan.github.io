import React from 'react';
import type { WidgetProps } from '@rjsf/utils';
import { Input } from '@site/src/components/ui/input';
import { Label } from '@site/src/components/ui/label';
import { Textarea } from '@site/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@site/src/components/ui/select';
import { cn } from '@site/src/lib/utils';

export function TextWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, onBlur, onFocus, schema, options } = props;
  const isNumber = schema.type === 'number' || schema.type === 'integer' || options.type === 'number';

  return (
    <Input
      id={id}
      value={value ?? ''}
      required={required}
      disabled={disabled || readonly}
      type={isNumber ? 'number' : 'text'}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
          onChange(undefined);
          return;
        }
        if (isNumber) {
          const num = schema.type === 'integer' ? parseInt(val, 10) : parseFloat(val);
          onChange(isNaN(num) ? undefined : num);
        } else {
          onChange(val);
        }
      }}
      onBlur={onBlur && ((e: React.FocusEvent<HTMLInputElement>) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e: React.FocusEvent<HTMLInputElement>) => onFocus(id, e.target.value))}
      className="h-8 text-xs"
    />
  );
}

export function TextareaWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, onBlur, onFocus } = props;
  
  return (
    <Textarea
      id={id}
      value={value ?? ''}
      required={required}
      disabled={disabled || readonly}
      className="text-xs"
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value === '' ? undefined : e.target.value)}
      onBlur={onBlur && ((e: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, e.target.value))}
      onFocus={onFocus && ((e: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, e.target.value))}
    />
  );
}

export function SelectWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, options } = props;
  const { enumOptions, enumDisabled } = options;

  return (
    <Select
      value={value === undefined || value === null ? '' : String(value)}
      onValueChange={(val: string) => onChange(val)}
      disabled={disabled || readonly}
    >
      <SelectTrigger id={id} className="h-8 text-xs">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        {enumOptions?.map((option, i) => {
          const isDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <SelectItem key={i} value={String(option.value)} disabled={isDisabled} className="text-xs">
              {option.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function CheckboxWidget(props: WidgetProps) {
  const { id, value, required, disabled, readonly, onChange, label } = props;
  
  return (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={id}
        checked={typeof value === 'undefined' ? false : value}
        required={required}
        disabled={disabled || readonly}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      {label && <Label htmlFor={id} className="text-sm">{label}</Label>}
    </div>
  );
}

export const widgets = {
  TextWidget,
  TextareaWidget,
  SelectWidget,
  CheckboxWidget,
};
