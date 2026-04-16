import { SafeAreaView } from 'react-native-safe-area-context';
import { TunerScreen } from '@/components/practice/tuner/tuner-screen';

export default function BassScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <TunerScreen instrument="bassist" />
    </SafeAreaView>
  );
}
