// src/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { colors } from './src/theme';
import { supabase } from './src/api/supabaseClient';
import LoginScreen from './src/screens/LoginScreen';
import CheckinScreen from './src/screens/CheckInScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SelectMedicationsScreen from './src/screens/SelectMedicationsScreen';
import QueueStatusScreen from './src/screens/QueueStatusScreen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/notifications';

type RootStackParamList = {
  Login: undefined;
  SelectMedications: {
    pharmacy: {
      id: string;
      name: string;
      address?: string;
    };
    user: {
      id: string;
      email: string;
    };
  };
  Checkin: {
    pharmacy: {
      id: string;
      name: string;
      address?: string;
    };
    user: {
      id: string;
      email: string;
    };
    selectedMedications?: Array<{
      medication: {
        id: string;
        name: string;
        dosage?: string;
      };
      quantity: number;
    }>;
  };
  History: undefined;
  QueueStatus: {
    pharmacy: {
      id: string;
      name: string;
      address?: string;
    };
    user: {
      id: string;
      email: string;
    };
    queueNumber: number;
  };
} & ParamListBase;

const Stack = createNativeStackNavigator<RootStackParamList>();

// Opções padrão de navegação
const navigationConfig = {
  screens: {
    Login: LoginScreen,
    Checkin: CheckinScreen,
    History: HistoryScreen
  }
};

const defaultScreenOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#f4511e',
  },
  headerTintColor: '#fff',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
};

export default function App() {
  const handleLogout = async (navigation: any) => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sim",
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const LogoutButton = ({ navigation }: any) => (
    <TouchableOpacity 
      onPress={() => handleLogout(navigation)}
      style={{ marginRight: 15 }}
    >
      <Text style={{ color: colors.white, fontSize: 18, marginRight:4}}> Sair </Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    // handler para receber notificações enquanto app em foreground
    const subscription = Notifications.addNotificationReceivedListener(notification => {
     // console.log('Received notification:', notification);
    });

    // resposta quando o usuário interage
    const respSub = Notifications.addNotificationResponseReceivedListener(response => {
     // console.log('Notification response:', response);
    });

    return () => {
      subscription.remove();
      respSub.remove();
    };
  }, []);


  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ 
            title: 'Login',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="SelectMedications" 
          component={SelectMedicationsScreen}
          options={({ navigation }) => ({
            title: 'Selecionar Medicamentos',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        />
        <Stack.Screen 
          name="Checkin" 
          component={CheckinScreen}
          options={({ navigation }) => ({
            title: 'Check-in',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={({ navigation }) => ({
            title: 'Histórico',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        />
        <Stack.Screen 
          name="QueueStatus" 
          component={QueueStatusScreen}
          options={({ navigation }) => ({
            title: 'Status da Fila',
            headerRight: () => <LogoutButton navigation={navigation} />
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
