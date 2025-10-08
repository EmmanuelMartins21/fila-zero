import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { supabase } from '../api/supabaseClient';
import { colors, spacing, typography, containers, forms } from '../theme';

export default function QueueStatusScreen({ route, navigation }) {
  const { pharmacy, user, queueNumber } = route.params;
  const [queueStatus, setQueueStatus] = useState({
    currentNumber: 0,
    estimatedWaitMinutes: 0,
    position: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueueStatus = async () => {
    try {
      // Buscar informações atuais da fila
      const { data: queueData } = await supabase
        .from('queues')
        .select('current_number, estimated_wait_minutes')
        .eq('pharmacy_id', pharmacy.id)
        .single();

      // Buscar posição na fila (quantos check-ins existem antes do seu número)
      const { count } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact', head: true })
        .eq('pharmacy_id', pharmacy.id)
        .lt('queue_number', queueNumber);

      setQueueStatus({
        currentNumber: queueData?.current_number || 0,
        estimatedWaitMinutes: queueData?.estimated_wait_minutes || 0,
        position: count || 0
      });
    } catch (error) {
      console.error('Erro ao carregar status da fila:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleLeaveQueue = async () => {
    Alert.alert(
      'Sair da Fila',
      'Tem certeza que deseja sair da fila? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sair da Fila',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Remover o check-in
              await supabase
                .from('check_ins')
                .delete()
                .eq('pharmacy_id', pharmacy.id)
                .eq('user_id', user.id)
                .eq('queue_number', queueNumber);

              // Navegar de volta para a tela inicial com os dados do usuário
              navigation.reset({
                index: 0,
                routes: [{ name: 'Checkin', params: { user } }],
              });

              Alert.alert('Sucesso', 'Você saiu da fila com sucesso');
            } catch (error) {
              console.error('Erro ao sair da fila:', error);
              Alert.alert('Erro', 'Não foi possível sair da fila. Tente novamente.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadQueueStatus();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadQueueStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadQueueStatus();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const estimatedTimeRemaining = queueStatus.position * (queueStatus.estimatedWaitMinutes / 3); // assume 3 atendimentos por tempo estimado

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.card}>
        <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
        <Text style={styles.pharmacyAddress}>{pharmacy.address}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Seu número</Text>
        <Text style={styles.queueNumber}>{queueNumber}</Text>
        
        <Text style={styles.label}>Número atual</Text>
        <Text style={styles.currentNumber}>{queueStatus.currentNumber}</Text>
        
        <Text style={styles.label}>Sua posição</Text>
        <Text style={styles.position}>
          {queueStatus.position === 0 ? 'Próximo!' : `${queueStatus.position}º na fila`}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tempo estimado de espera</Text>
        <Text style={styles.waitTime}>
          {estimatedTimeRemaining < 1 
            ? 'Menos de 1 minuto' 
            : `${Math.round(estimatedTimeRemaining)} minutos`}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={handleLeaveQueue}
        >
          <Text style={styles.leaveButtonText}>Sair da Fila</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.updateInfo}>
        Atualizando automaticamente a cada 30 segundos{'\n'}
        Puxe para baixo para atualizar manualmente
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...containers.screen,
  },
  card: {
    ...containers.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  pharmacyName: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pharmacyAddress: {
    ...typography.body,
    color: colors.text,
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.7,
    marginTop: spacing.md,
  },
  queueNumber: {
    ...typography.title,
    color: colors.primary,
    fontSize: 36,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  currentNumber: {
    ...typography.title,
    color: colors.text,
    fontSize: 32,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  position: {
    ...typography.subtitle,
    color: colors.action,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  waitTime: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  updateInfo: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  leaveButton: {
    ...forms.button,
    backgroundColor: colors.error,
  },
  leaveButtonText: {
    ...forms.buttonText,
    color: colors.white,
  },
});