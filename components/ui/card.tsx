import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl',
        variant === 'default' && 'bg-surface',
        variant === 'elevated' && 'bg-surface-alt',
        variant === 'outlined' && 'bg-transparent border border-border',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  );
}
