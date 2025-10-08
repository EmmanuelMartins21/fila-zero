// src/screens/CheckinScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { colors, spacing, typography, containers, forms, shadows } from '../theme';

import { Pharmacy } from '../types';

export default function CheckinScreen({ route, navigation }: any) {
  const { user, pharmacy, selectedMedications } = route.params;
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(pharmacy || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPharmacies();
  }, []);

  const loadPharmacies = async () => {
    try {
      console.log('Carregando farmácias...');
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('name');
    
      if (error) throw error;

      setPharmacies(data || []);
    } catch (err) {
      console.error('Erro ao carregar farmácias:', err);
      Alert.alert('Erro', 'Não foi possível carregar a lista de farmácias');
    } finally {
      setIsLoading(false);
    }
  };

  const selectPharmacy = (pharmacy: Pharmacy) => {
    navigation.navigate('SelectMedications', { pharmacy, user });
  };
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (selectedPharmacy) {
      // opcional: fetch queue info
      (async () => {
        const { data } = await supabase
          .from('queues')
          .select('*')
          .eq('pharmacy_id', selectedPharmacy.id)
          .maybeSingle();

        if (data) {
          setEstimatedMinutes(data.estimated_wait_minutes);
        }
      })();
    }
  }, [selectedPharmacy]);

  const handleCheckin = async () => {
    if (!pharmacy || !selectedMedications || selectedMedications.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um medicamento');
      return;
    }

    try {
      // 1) obter/atualizar número da fila (simplificado: incrementa current_number)
      const { data: q } = await supabase
        .from('queues')
        .select('*')
        .eq('pharmacy_id', pharmacy.id)
        .maybeSingle();

      let nextNumber = 1;
      if (q) {
        nextNumber = (q.current_number || 0) + 1;
        await supabase.from('queues').update({ current_number: nextNumber }).eq('id', q.id);
      } else {
        const { data: newQ } = await supabase
          .from('queues')
          .insert([{ pharmacy_id: pharmacy.id, current_number: nextNumber }])
          .select()
          .single();
      }

      // 2) criar check_in
      const { data: checkin } = await supabase
        .from('check_ins')
        .insert([{ 
          user_id: user.id, 
          pharmacy_id: pharmacy.id, 
          queue_number: nextNumber,
          medications: selectedMedications
        }])
        .select()
        .single();

      setQueueNumber(nextNumber);

      // 3) (opcional) enviar notificação futura via função backend quando estiver próximo

      // Navegar para a tela de status da fila
      navigation.replace('QueueStatus', {
        pharmacy,
        user,
        queueNumber: nextNumber
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Falha ao fazer check-in');
    }
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <TouchableOpacity 
      style={[
        styles.pharmacyItem,
        selectedPharmacy?.id === item.id && styles.selectedPharmacy
      ]}
      onPress={() => selectPharmacy(item)}
    >
      <Text style={styles.pharmacyName}>{item.name}</Text>
      <Text style={styles.pharmacyAddress}>{item.address}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Se já temos uma farmácia e medicamentos selecionados, mostrar apenas o modal
  if (pharmacy && selectedMedications) {
    return (
      <View style={styles.container}>
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => navigation.navigate('SelectMedications', { pharmacy, user })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.subtitle}>Confirmar Check-in</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('SelectMedications', { pharmacy, user })}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
              <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>
              
              {/* Lista de medicamentos selecionados */}
              <View style={styles.medicationsList}>
                <Text style={styles.subtitle}>Medicamentos selecionados:</Text>
                {selectedMedications.map((med, index) => (
                  <Text key={index} style={styles.medicationItem}>
                    • {med.medication.name} ({med.quantity}x)
                  </Text>
                ))}
              </View>

              <Text style={styles.waitTime}>
                Tempo estimado: {estimatedMinutes ?? '—'} minutos
              </Text>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleCheckin}
              >
                <Text style={styles.actionButtonText}>Confirmar Check-in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Se não temos farmácia selecionada, mostrar lista de farmácias
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecione uma farmácia</Text>
      
      <FlatList
        data={pharmacies}
        renderItem={renderPharmacyItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        contentContainerStyle={{ padding: spacing.xs }}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={selectedPharmacy !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedPharmacy(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.subtitle}>Farmácia selecionada</Text>
              <TouchableOpacity 
                onPress={() => setSelectedPharmacy(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {selectedPharmacy && (
              <>
                <Text style={styles.pharmacyName}>{selectedPharmacy.name}</Text>
                <Text style={styles.pharmacyAddress}>{selectedPharmacy.address}</Text>
                <Text style={styles.waitTime}>
                  Tempo estimado: {estimatedMinutes ?? '—'} minutos
                </Text>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleCheckin}
                >
                  <Text style={styles.actionButtonText}>Confirmar Check-in</Text>
                </TouchableOpacity>
                {queueNumber && (
                  <Text style={styles.queueNumber}>Seu número: {queueNumber}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...containers.screen,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.lg,
  },
  list: {
    flex: 1,
  },
  pharmacyItem: {
    ...containers.card,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPharmacy: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  pharmacyName: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pharmacyAddress: {
    ...typography.caption,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    ...containers.card,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...typography.title,
    color: colors.text,
    marginTop: -4,
  },
  subtitle: {
    ...typography.subtitle,
    marginBottom: spacing.sm,
    color: colors.primary,
  },
  waitTime: {
    ...typography.body,
    marginVertical: spacing.md,
  },
  queueNumber: {
    ...typography.title,
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.action,
  },
  actionButton: {
    ...forms.button,
    marginTop: spacing.md,
  },
  actionButtonText: {
    ...forms.buttonText,
  },
  medicationsList: {
    marginVertical: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  medicationItem: {
    ...typography.body,
    marginVertical: spacing.xs,
    color: colors.text,
  },
});
