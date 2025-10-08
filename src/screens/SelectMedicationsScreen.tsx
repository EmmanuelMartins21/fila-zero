import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { supabase } from '../api/supabaseClient';
import { colors, spacing, typography, containers, forms } from '../theme';
import { Medication, SelectedMedication, Pharmacy } from '../types';

export default function SelectMedicationsScreen({ route, navigation }) {
  const { pharmacy, user } = route.params;
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      
     
      // Buscar medicamentos disponíveis na farmácia selecionada
      const { data, error } = await supabase
        .from('medications')
        .select('id, name, dosage, description, pharmacy_id')
        .eq('pharmacy_id', pharmacy.id);
      
      if (error) throw error;
      
      setMedications(data || []);
      
    } catch (err) {
      console.error('Erro ao carregar medicamentos:', err);
      Alert.alert('Erro', 'Não foi possível carregar a lista de medicamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (medication: Medication, quantity: number) => {
    if (quantity < 0) return;

    setSelectedMedications(current => {
      const existing = current.find(item => item.medication.id === medication.id);
      if (existing) {
        if (quantity === 0) {
          return current.filter(item => item.medication.id !== medication.id);
        }
        return current.map(item =>
          item.medication.id === medication.id
            ? { ...item, quantity }
            : item
        );
      }
      if (quantity > 0) {
        return [...current, { medication, quantity }];
      }
      return current;
    });
  };

  const getQuantityForMedication = (medicationId: string): number => {
    const selected = selectedMedications.find(
      item => item.medication.id === medicationId
    );
    return selected?.quantity || 0;
  };

  const handleContinue = () => {
    if (selectedMedications.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um medicamento');
      return;
    }

    // Navega para o Checkin com os dados necessários e flag para mostrar modal
    navigation.navigate('Checkin', {
      pharmacy,
      user,
      selectedMedications,
      showConfirmModal: true // Adiciona flag para mostrar o modal
    });
  };

  console.log('Renderizando com medicamentos:', medications);
  
  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  console.log('Medicamentos filtrados:', filteredMedications);

  const renderMedicationItem = ({ item: medication }) => {
    const quantity = getQuantityForMedication(medication.id);

    return (
      <View style={styles.medicationItem}>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{medication.name}</Text>
          {medication.dosage && (
            <Text style={styles.medicationDosage}>{medication.dosage}</Text>
          )}
          {medication.description && (
            <Text style={styles.medicationDescription}>{medication.description}</Text>
          )}
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(medication, quantity - 1)}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(medication, quantity + 1)}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar medicamentos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={colors.placeholder}
      />

      <FlatList
        data={filteredMedications}
        renderItem={renderMedicationItem}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum medicamento encontrado
          </Text>
        }
      />

      {selectedMedications.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedMedications.length} {selectedMedications.length === 1 ? 'item selecionado' : 'itens selecionados'}
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...containers.screen,
  },
  searchInput: {
    ...forms.input,
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.xs,
  },
  medicationItem: {
    ...containers.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  medicationInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  medicationName: {
    ...typography.subtitle,
    color: colors.text,
  },
  medicationDosage: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  medicationDescription: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  quantityText: {
    ...typography.subtitle,
    marginHorizontal: spacing.md,
    minWidth: 30,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.placeholder,
  },
  footer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedCount: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  continueButton: {
    ...forms.button,
  },
  continueButtonText: {
    ...forms.buttonText,
  },
});