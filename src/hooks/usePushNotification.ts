import { useState, useEffect, useCallback } from 'react';
import {
  isPushNotificationSupported,
  getPushPermissionState,
  requestPushPermission,
  sendPushNotificationToClients,
  playNotificationChime,
  getPushHistory,
  PushNotificationPayload,
} from '../services/pushNotificationService';

export function usePushNotification() {
  const [isSupported] = useState(() => isPushNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermission>(() => getPushPermissionState());
  const [pushHistory, setPushHistory] = useState<PushNotificationPayload[]>(() => getPushHistory());
  const [lastReceived, setLastReceived] = useState<PushNotificationPayload | null>(null);

  // Sync state on focus/visibility change (in case user changed permissions in browser settings)
  const refreshPermission = useCallback(() => {
    setPermission(getPushPermissionState());
    setPushHistory(getPushHistory());
  }, []);

  useEffect(() => {
    const handleFocus = () => refreshPermission();
    window.addEventListener('focus', handleFocus);

    // Listen for incoming broadcast push events
    const handlePushReceived = (e: Event) => {
      const customEvt = e as CustomEvent<PushNotificationPayload>;
      if (customEvt.detail) {
        setLastReceived(customEvt.detail);
        setPushHistory(getPushHistory());
      }
    };

    window.addEventListener('estudiovip-push-received', handlePushReceived);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('estudiovip-push-received', handlePushReceived);
    };
  }, [refreshPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await requestPushPermission();
    setPermission(getPushPermissionState());
    return granted;
  }, []);

  const sendNotification = useCallback(
    async (payload: {
      title: string;
      body: string;
      type: PushNotificationPayload['type'];
      clientName?: string;
      appointmentId?: string;
      url?: string;
    }) => {
      const result = await sendPushNotificationToClients(payload);
      setPushHistory(getPushHistory());
      return result;
    },
    []
  );

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default',
    requestPermission,
    sendNotification,
    playChime: playNotificationChime,
    pushHistory,
    lastReceived,
    refreshPermission,
  };
}
