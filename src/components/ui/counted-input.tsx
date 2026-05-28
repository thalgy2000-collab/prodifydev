import * as React from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { cn } from '@/lib/utils';

function counterColor(len: number, max: number) {
  const ratio = max > 0 ? len / max : 0;
  if (ratio >= 1) return 'text-destructive font-semibold';
  if (ratio >= 0.8) return 'text-amber-400';
  return 'text-muted-foreground';
}

interface CounterProps {
  value: number;
  max: number;
  className?: string;
}

export const CharCounter = ({ value, max, className }: CounterProps) => (
  <span className={cn('text-xs tabular-nums', counterColor(value, max), className)}>
    {value}/{max}
  </span>
);

type InputProps = React.ComponentProps<'input'> & {
  maxLength: number;
  containerClassName?: string;
  inline?: boolean; // counter inline to the right (compact)
};

export const CountedInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ maxLength, containerClassName, inline, value, defaultValue, onFocus, onBlur, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const v = (value ?? defaultValue ?? '') as string;
    const len = typeof v === 'string' ? v.length : 0;
    const show = focused || len > 0;

    if (inline) {
      return (
        <div className={cn('relative w-full', containerClassName)}>
          <Input
            ref={ref}
            maxLength={maxLength}
            value={value as any}
            defaultValue={defaultValue as any}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cn(show && 'pr-16', className)}
            {...props}
          />
          {show && (
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <CharCounter value={len} max={maxLength} />
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn('w-full', containerClassName)}>
        <Input
          ref={ref}
          maxLength={maxLength}
          value={value as any}
          defaultValue={defaultValue as any}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={className}
          {...props}
        />
        <div className="mt-1 flex justify-end min-h-[1rem]">
          {show && <CharCounter value={len} max={maxLength} />}
        </div>
      </div>
    );
  },
);
CountedInput.displayName = 'CountedInput';

type TextareaProps = React.ComponentProps<'textarea'> & {
  maxLength: number;
  containerClassName?: string;
};

export const CountedTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ maxLength, containerClassName, value, defaultValue, onFocus, onBlur, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const v = (value ?? defaultValue ?? '') as string;
    const len = typeof v === 'string' ? v.length : 0;
    const show = focused || len > 0;

    return (
      <div className={cn('relative w-full', containerClassName)}>
        <Textarea
          ref={ref}
          maxLength={maxLength}
          value={value as any}
          defaultValue={defaultValue as any}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          className={cn(show && 'pb-6', className)}
          {...props}
        />
        {show && (
          <div className="pointer-events-none absolute bottom-1.5 right-2">
            <CharCounter value={len} max={maxLength} />
          </div>
        )}
      </div>
    );
  },
);
CountedTextarea.displayName = 'CountedTextarea';
