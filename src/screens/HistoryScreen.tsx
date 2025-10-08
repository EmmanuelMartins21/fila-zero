// src/screens/HistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { colors, spacing, typography, containers } from '../theme';

export default function HistoryScreen({ route }: any) {
  const { user } = route.params;
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('pickups')
        .select('*')
        .eq('user_id', user.id)
        .order('pickup_date', { ascending: false });
      setHistory(data || []);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histórico de Retiradas</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.historyCard}>
            <Text style={styles.medicationText}>{item.medication}</Text>
            <Text style={styles.quantityText}>Quantidade: {item.quantity}</Text>
            <Text style={styles.dateText}>{new Date(item.pickup_date).toLocaleString()}</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...containers.screen,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  listContent: {
    padding: spacing.xs,
  },
  historyCard: {
    ...containers.card,
    marginBottom: spacing.sm,
  },
  medicationText: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  quantityText: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.placeholder,
  },
});

