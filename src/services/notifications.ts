// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../api/supabaseClient';

export async function registerForPushNotificationsAsync(userId?: string) {
  let token;
  if (!Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;

  // Salvar token no perfil do usuário (supabase profiles)
  if (userId) {
    await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);
  }

  return token;
}
