// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { colors, spacing, typography, containers, forms } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const [cpf, setCpf] = useState('');
  const [sus, setSus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!cpf || !sus) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos');
      return;
    }

    if (cpf.length !== 11) {
      Alert.alert('Atenção', 'CPF deve ter 11 dígitos');
      return;
    }

    setIsLoading(true);

    try {
      // Verifica se já existe um perfil com este CPF
      const { data: existing, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('cpf', cpf)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw new Error('Erro ao verificar usuário');
      }

      if (existing) {
        // Se existe, envia o magic link
        const email = `${cpf}@gmail.com`;
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false // não criar novo usuário se não existir
          }
        });

        if (signInError) {
          throw new Error('Erro ao enviar link de login: ' + signInError.message);
        }

        // Mostra mensagem de sucesso
        Alert.alert(
          'Link de acesso enviado!',
          'Enviamos um link mágico para seu email. Por favor, clique no link para fazer login.',
          [{ text: 'OK' }]
        );

        // Limpa os campos
        setCpf('');
        setSus('');
        return;
      }

      // Se não existe, primeiro faz sign-in/sign-up no auth
      const email = `${cpf}@gmail.com`;
      const password = `${cpf}${sus}`;

      // Tenta fazer login primeiro
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Se não conseguir fazer login, tenta criar uma nova conta
      if (signInError) {
        console.log('Erro no login, tentando criar conta...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          console.error('Erro no signup:', signUpError);
          throw new Error('Erro ao criar conta: ' + signUpError.message);
        }

        if (!signUpData?.user?.id) {
          console.error('Dados do signup:', signUpData);
          throw new Error('Erro ao criar conta: ID do usuário não retornado');
        }

        // Cria o perfil usando o ID do usuário autenticado
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: signUpData.user.id,
              cpf,
              sus_card: sus,
              full_name: 'Usuário MVP'
            }
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error('Erro ao criar perfil: ' + insertError.message);
        }

        navigation.replace('Checkin', { user: newProfile });
      } else {
        // Login bem sucedido, busca o perfil
        if (!signInData?.user?.id) {
          console.error('Dados do signin:', signInData);
          throw new Error('Erro no login: ID do usuário não retornado');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        if (profileError) {
          console.error('Erro ao buscar perfil:', profileError);
          throw new Error('Erro ao buscar perfil: ' + profileError.message);
        }

        if (!profile) {
          console.error('Perfil não encontrado para o ID:', signInData.user.id);
          throw new Error('Erro ao buscar perfil: perfil não encontrado');
        }

        navigation.replace('Checkin', { user: profile });
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Erro', err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Fila Zero</Text>
        <View style={styles.form}>
          <Text style={styles.label}>CPF</Text>
          <TextInput 
            value={cpf}
            onChangeText={text => setCpf(text.replace(/\D/g, ''))}
            placeholder="Digite apenas números"
            style={styles.input}
            keyboardType="numeric"
            maxLength={11}
            editable={!isLoading}
            placeholderTextColor={colors.placeholder}
          />
          
          <Text style={styles.label}>Cartão SUS</Text>
          <TextInput 
            value={sus}
            onChangeText={text => setSus(text.replace(/\D/g, ''))}
            placeholder="Digite apenas números"
            style={styles.input}
            keyboardType="numeric"
            maxLength={15}
            editable={!isLoading}
            placeholderTextColor={colors.placeholder}
          />

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
          ) : (
            <TouchableOpacity 
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...containers.screen,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  card: {
    ...containers.card,
    marginHorizontal: spacing.md,
  },
  form: {
    width: '100%',
  },
  label: {
    ...forms.label,
  },
  input: {
    ...forms.input,
  },
  button: {
    ...forms.button,
    marginTop: spacing.md,
  },
  buttonText: {
    ...forms.buttonText,
  },
  loading: {
    marginTop: spacing.xl,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.xl,
    color: colors.primary,
  }
});
