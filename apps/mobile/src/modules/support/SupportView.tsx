import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/shared/ui/AppText';
import { ExternalLinkRow } from '@/shared/ui/ExternalLinkRow';
import { Screen } from '@/shared/ui/Screen';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { SUPPORT_CHANNELS, SUPPORT_FAQS, SUPPORT_INTRO } from './support-content';

export function SupportView() {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [linkError, setLinkError] = useState<string | null>(null);

  function toggleFaq(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="title">Ayuda y Soporte</AppText>
          <AppText color={colors.textSecondary}>{SUPPORT_INTRO}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Preguntas frecuentes</AppText>
          <View style={styles.faqList}>
            {SUPPORT_FAQS.map((item) => {
              const open = openIds.has(item.id);
              return (
                <View key={item.id} style={styles.faqItem}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.question}
                    accessibilityState={{ expanded: open }}
                    onPress={() => toggleFaq(item.id)}
                    style={styles.faqQuestion}
                  >
                    <AppText variant="label" style={styles.faqQuestionText}>
                      {item.question}
                    </AppText>
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {open ? (
                    <AppText color={colors.textSecondary} style={styles.answer}>
                      {item.answer}
                    </AppText>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="heading">Contacto</AppText>
          {SUPPORT_CHANNELS.map((channel) => (
            <ExternalLinkRow
              key={channel.id}
              icon={channel.icon}
              label={channel.label}
              description={channel.description}
              url={channel.url}
              onError={setLinkError}
            />
          ))}
          {linkError ? (
            <AppText variant="caption" color={colors.negative} accessibilityRole="alert">
              {linkError}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: spacing.xl, paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.xs },
  section: { gap: spacing.md },
  faqList: { gap: spacing.sm },
  faqItem: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  faqQuestionText: { flex: 1 },
  answer: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
