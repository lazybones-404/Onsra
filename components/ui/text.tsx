import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

interface OnsraTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: 'foreground' | 'muted' | 'accent' | 'success' | 'danger' | 'warning';
}

export function Text({
  variant = 'body',
  color = 'foreground',
  className,
  children,
  ...props
}: OnsraTextProps) {
  return (
    <RNText
      className={cn(
        variant === 'h1' && 'text-4xl font-bold',
        variant === 'h2' && 'text-2xl font-bold',
        variant === 'h3' && 'text-xl font-semibold',
        variant === 'body' && 'text-base',
        variant === 'caption' && 'text-sm',
        variant === 'label' && 'text-xs font-semibold uppercase tracking-widest',
        color === 'foreground' && 'text-foreground',
        color === 'muted' && 'text-muted',
        color === 'accent' && 'text-accent',
        color === 'success' && 'text-success',
        color === 'danger' && 'text-danger',
        color === 'warning' && 'text-warning',
        className,
      )}
      {...props}
    >
      {children}
    </RNText>
  );
}
