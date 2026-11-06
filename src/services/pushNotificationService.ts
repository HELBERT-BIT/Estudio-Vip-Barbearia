/**
 * Push Notification Service for Estúdio VIP Barbearia PWA
 * Handles browser notification permissions, native service worker notification displays,
 * audio chime synthesis via Web Audio API, and cross-tab broadcasts.
 */

export interface PushNotificationPayload {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'alteracao_horario' | 'lembrete' | 'vaga_liberada' | 'aviso_geral' | 'personalizado' | 'novo_agendamento' | 'cancelamento';
  clientName?: string;
  appointmentId?: string;
  url?: string;
}

const STORAGE_KEYS = {
  PUSH_ALLOWED: 'estudiovip_push_allowed',
  PUSH_HISTORY: 'estudiovip_push_history',
};

// Cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('estudiovip_push_events');
  }
} catch {
  // BroadcastChannel not supported in older runtimes
}

/**
 * Checks if the browser supports native Web Notifications
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Returns current permission state ('default', 'granted', 'denied')
 */
export function getPushPermissionState(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Synthesizes a pleasant luxury barber chime using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First note (D5 ~ 587 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);

    // Second note (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

/**
 * Requests browser permission from the client to receive notifications
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(STORAGE_KEYS.PUSH_ALLOWED, 'true');
      playNotificationChime();

      // Send initial welcome push notification to confirm
      await dispatchNativeNotification(
        'Estúdio VIP Barbearia ✂️',
        'Notificações ativadas com sucesso! Você receberá avisos de horários, confirmações e lembretes com 10 min de tolerância.',
        {
          tag: 'estudiovip-welcome',
          silent: false,
        }
      );

      return true;
    }
    return false;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Dispatches a native browser notification (via ServiceWorker or Notification API)
 */
async function dispatchNativeNotification(
  title: string,
  body: string,
  options?: { tag?: string; url?: string; silent?: boolean }
): Promise<boolean> {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notifOptions: NotificationOptions & { vibrate?: number[] } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/favicon.ico',
    tag: options?.tag || `estudiovip-${Date.now()}`,
    vibrate: [200, 100, 200],
    data: { url: options?.url || '/' },
  };

  try {
    // Try Service Worker registration first (standard for PWAs)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notifOptions);
        return true;
      }
    }
    // Fallback to direct Notification constructor
    new Notification(title, notifOptions);
    return true;
  } catch {
    try {
      new Notification(title, notifOptions);
      return true;
    } catch (err) {
      console.warn('Direct notification fallback failed:', err);
      return false;
    }
  }
}

/**
 * Dispatches a push notification to client devices
 * Used by the Admin Panel to broadcast schedule alterations, reminders, or general announcements.
 */
export async function sendPushNotificationToClients(payload: {
  title: string;
  body: string;
  type: PushNotificationPayload['type'];
  clientName?: string;
  appointmentId?: string;
  url?: string;
}): Promise<{ success: boolean; dispatchedToBrowser: boolean }> {
  const fullPayload: PushNotificationPayload = {
    id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: payload.title,
    body: payload.body,
    timestamp: new Date().toISOString(),
    type: payload.type,
    clientName: payload.clientName,
    appointmentId: payload.appointmentId,
    url: payload.url || '/',
  };

  // 1. Save in push history so client can see unread notifications in the app
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUSH_HISTORY);
    const history: PushNotificationPayload[] = raw ? JSON.parse(raw) : [];
    history.unshift(fullPayload);
    localStorage.setItem(STORAGE_KEYS.PUSH_HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch {
    // ignore
  }

  // 2. Play audio feedback
  playNotificationChime();

  // 3. Dispatch native browser notification
  let dispatched = false;
  if (getPushPermissionState() === 'granted') {
    dispatched = await dispatchNativeNotification(payload.title, payload.body, {
      tag: `estudiovip-${payload.type}`,
      url: payload.url,
    });
  }

  // 4. Broadcast to all open tabs / devices via BroadcastChannel & window event
  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage(fullPayload);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('estudiovip-push-received', { detail: fullPayload }));
    }
  } catch (err) {
    console.warn('Error broadcasting push message:', err);
  }

  return {
    success: true,
    dispatchedToBrowser: dispatched,
  };
}

/**
 * Returns saved push notification history for the client
 */
export function getPushHistory(): PushNotificationPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PUSH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Clears push notification history
 */
export function clearPushHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PUSH_HISTORY);
  } catch {
    // ignore
  }
}
