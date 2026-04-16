import { SafeAreaView, ScrollView, View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils/cn';

interface SafeScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
}

export function SafeScreen({
  children,
  scroll = false,
  padded = true,
  className,
  ...props
}: SafeScreenProps) {
  const inner = (
    <View
      className={cn('flex-1', padded && 'px-5', className)}
      {...props}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {inner}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {inner}
    </SafeAreaView>
  );
}
