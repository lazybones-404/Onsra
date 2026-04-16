import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Tuning } from '@/constants/tunings';
import { colors } from '@/constants/theme';

interface TuningPickerProps {
  tunings: Tuning[];
  activeTuning: Tuning;
  onSelect: (tuning: Tuning) => void;
  visible: boolean;
  onClose: () => void;
  onOpenCustom?: () => void;
}

export function TuningPicker({
  tunings,
  activeTuning,
  onSelect,
  visible,
  onClose,
  onOpenCustom,
}: TuningPickerProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
            Select Tuning
          </Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={22} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Tuning list */}
        <FlatList
          data={tunings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}
          renderItem={({ item }) => {
            const isActive = item.id === activeTuning.id;
            return (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginVertical: 2,
                  backgroundColor: isActive ? colors.accentMuted : colors.surface,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: isActive ? colors.accent : 'transparent',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    {item.strings.map((s) => s.note).join(' · ')}
                  </Text>
                </View>
                {isActive && (
                  <MaterialIcons name="check" size={20} color={colors.accent} />
                )}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            onOpenCustom ? (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onOpenCustom();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                }}
              >
                <MaterialIcons name="add" size={20} color={colors.accent} />
                <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '600' }}>
                  Custom Tuning
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
