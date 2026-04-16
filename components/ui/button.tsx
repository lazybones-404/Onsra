import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils/cn';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      className={cn(
        'flex-row items-center justify-center rounded-xl',
        size === 'sm' && 'px-4 py-2.5',
        size === 'md' && 'px-6 py-3.5',
        size === 'lg' && 'px-8 py-4',
        variant === 'primary' && 'bg-accent',
        variant === 'secondary' && 'bg-surface border border-border',
        variant === 'ghost' && 'bg-transparent',
        variant === 'danger' && 'bg-danger',
        isDisabled && 'opacity-40',
        className,
      )}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : '#7C6CF7'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        className={cn(
          'font-semibold',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
          variant === 'primary' && 'text-white',
          variant === 'secondary' && 'text-foreground',
          variant === 'ghost' && 'text-accent',
          variant === 'danger' && 'text-white',
        )}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
