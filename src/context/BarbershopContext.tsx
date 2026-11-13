import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { 
  BarberService, 
  BarbershopSettings, 
  Appointment, 
  Announcement, 
  AdminNotification, 
  UserAccount, 
  PaymentMethod, 
  PaymentStatus, 
  AppointmentStatus,
  WorkingDayConfig,
  BarberReview,
  RegisteredClient,
  NotificationDurationType
} from '../types';
import { 
  initialServices, 
  initialSettings, 
  initialAnnouncements, 
  initialAppointments, 
  initialNotifications,
  initialReviews,
  getTodayString 
} from '../data/initialData';
import { 
  sendPushNotificationToClients, 
  PushNotificationPayload, 
  playNotificationChime 
} from '../services/pushNotificationService';
import {
  fetchAppointmentsAndStatusFromSupabase,
  fetchAppointmentsFromSupabase,
  insertAppointmentToSupabase,
  updateAppointmentInSupabase,
  deleteAppointmentFromSupabase,
  deleteAllAppointmentsFromSupabase,
  subscribeToAppointmentsRealtime,
  saveBarbershopStatusToSupabase,
  insertClientIfNotExistsToSupabase,
  fetchClientsFromSupabase,
  sendNotificationToSupabase,
  fetchNotificationsFromSupabase,
  deleteNotificationFromSupabase,
  subscribeToNotificationsRealtime,
  SupabaseNotification,
  BarbershopGlobalStatus,
  NotificationDurationMeta,
  getLocalNotificationMetaMap,
  isNotificationValid,
} from '../lib/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export interface SlotAvailability {
  time: string;
  isAvailable: boolean;
  appointment?: Appointment;
  isLunchBreak?: boolean;
  isBlockedByOwner?: boolean;
  isPast?: boolean;
  isUnlockedForEncaixe?: boolean;
  isCustomExtra?: boolean;
  occupiedUntil?: string;
  unavailableReason?: string;
}

interface BarbershopContextType {
  // State
  services: BarberService[];
  settings: BarbershopSettings;
  appointments: Appointment[];
  announcements: Announcement[];
  notifications: AdminNotification[];
  reviews: BarberReview[];
  currentUser: UserAccount | null;
  registeredClients: RegisteredClient[];
  isAdminLoggedIn: boolean;
  isSupabaseConnected: boolean;
  activeView: 'client' | 'admin';
  clientActiveTab: 'home' | 'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber';
  adminActiveTab: 'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations' | 'reviews' | 'clients';
  toasts: ToastMessage[];

  // Avisos em Tempo Real do Supabase (Tabela notifications)
  supabaseNotifications: SupabaseNotification[];
  activeSupabaseNotifications: SupabaseNotification[];
  sendBarberAnnouncement: (
    title: string,
    message: string,
    type?: string,
    durationType?: NotificationDurationType,
    customMinutes?: number
  ) => Promise<boolean>;
  deleteBarberAnnouncement: (id: string | number) => Promise<boolean>;
  refreshSupabaseNotifications: () => Promise<void>;

  // Supabase Realtime
  refreshSupabaseAppointments: () => Promise<void>;

  // Admin Auth
  adminLogin: (user: string, pass: string) => boolean;
  adminLogout: () => void;

  // Registered Clients
  deleteRegisteredClient: (id: string) => void;
  addOrUpdateRegisteredClient: (client: Partial<RegisteredClient> & { name: string; phone: string }) => RegisteredClient;

  // Navigation & View Mode
  setActiveView: (view: 'client' | 'admin') => void;
  setClientActiveTab: (tab: 'home' | 'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber') => void;
  setAdminActiveTab: (tab: 'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations' | 'reviews' | 'clients') => void;
  
  // Toasts
  showToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;

  // Reviews & Barber Rating & Moderation
  addReview: (review: Omit<BarberReview, 'id' | 'createdAt'>) => void;
  deleteReview: (reviewId: string) => void;
  toggleHideReview: (reviewId: string) => void;
  replyToReview: (reviewId: string, replyText: string) => void;
  getBarberRatingStats: () => {
    average: number;
    count: number;
    distribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  };

  // Barbershop Status & Owner Manual Toggle
  isOpenNow: () => { 
    isOpen: boolean; 
    message: string; 
    todayConfig?: WorkingDayConfig;
    isManualOverride?: boolean;
    manualStatus?: 'open' | 'closed' | 'auto';
  };
  setManualBarbershopStatus: (status: 'open' | 'closed' | 'auto') => void;
  getAvailableSlots: (dateString: string, requestedDuration?: number) => SlotAvailability[];

  // Owner Slot Customization (Disponibilizar / Tirar Horários & Liberdade Total)
  toggleSlotBlocked: (dateString: string, timeSlot: string) => void;
  blockMultipleSlots: (dateString: string, slots: string[]) => void;
  unblockMultipleSlots: (dateString: string, slots: string[]) => void;
  unblockAllSlotsForDate: (dateString: string) => void;
  blockAllSlotsForDate: (dateString: string) => void;
  toggleLunchSlotUnlocked: (dateString: string, timeSlot: string) => void;
  togglePastSlotUnlocked: (dateString: string, timeSlot: string) => void;
  addCustomSlot: (dateString: string, timeSlot: string) => void;
  removeCustomSlot: (dateString: string, timeSlot: string) => void;
  setSlotIntervalMinutes: (intervalMinutes: number) => void;
  isSlotBlockedByOwner: (dateString: string, timeSlot: string) => boolean;
  isSlotLunchUnlocked: (dateString: string, timeSlot: string) => boolean;

  // Appointments (Supports multiple services combo / single & 50% reservation guarantee)
  createAppointment: (params: {
    serviceId?: string;
    serviceIds?: string[];
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    date: string;
    time: string;
    paymentType: 'antecipado' | 'presencial' | 'sinal_50';
    paymentMethod: PaymentMethod;
    depositAmount?: number;
    remainingAmount?: number;
    remainingPaymentMethod?: PaymentMethod;
    notes?: string;
  }) => Appointment | null;

  cancelAppointment: (id: string, reason: string, isFromAdmin?: boolean) => void;
  simulateDelayAndCancel: (id: string) => void;
  checkInAppointment: (id: string) => void;
  completeAppointment: (id: string) => void;
  registerPayment: (id: string, method: PaymentMethod, status: PaymentStatus) => void;

  // Services Management
  addService: (service: Omit<BarberService, 'id'>) => void;
  updateService: (id: string, service: Partial<BarberService>) => void;
  deleteService: (id: string) => void;

  // Settings & Working Hours
  updateSettings: (newSettings: Partial<BarbershopSettings>) => void;
  updateWorkingDay: (dayOfWeek: number, config: Partial<WorkingDayConfig>) => void;

  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncement: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Auth & Client Profile
  loginClient: (phoneOrEmail: string, name?: string, email?: string, password?: string) => void;
  logoutClient: () => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Demo Helpers & Data Reset
  resetToDefaults: () => void;
  resetTestData: () => void;
  isSystemCleaned: boolean;
  simulateIncomingBooking: () => void;
}

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

// Storage keys - Production clean keys for delivery to owner
const STORAGE_KEYS = {
  SERVICES: 'estudiovip_services_v8',
  ANNOUNCEMENTS: 'estudiovip_announcements_v8',
  NOTIFICATIONS: 'estudiovip_notifications_v8',
  USER: 'estudiovip_user_v7',
  REVIEWS: 'estudiovip_reviews_v6',
  CLIENTS: 'estudiovip_registered_clients_v2',
};

const defaultClients: RegisteredClient[] = [
  {
    id: 'cli-1',
    name: 'Rafael Oliveira',
    phone: '(67) 99944-0532',
    email: 'rafael@email.com',
    createdAt: '2026-10-15T10:00:00.000Z',
    lastBookingDate: '2026-11-04',
    totalBookings: 3,
    totalSpent: 135,
  },
  {
    id: 'cli-2',
    name: 'Carlos Eduardo',
    phone: '(67) 99876-1234',
    email: 'carlos.eduardo@email.com',
    createdAt: '2026-10-20T14:30:00.000Z',
    lastBookingDate: '2026-11-02',
    totalBookings: 2,
    totalSpent: 75,
  },
  {
    id: 'cli-3',
    name: 'Homega Silva',
    phone: '(67) 99876-4321',
    email: 'homegasilva34@gmail.com',
    createdAt: '2026-11-01T09:15:00.000Z',
    lastBookingDate: '2026-11-05',
    totalBookings: 1,
    totalSpent: 45,
  },
];

export const BarbershopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or fallback to defaults
  const [services, setServices] = useState<BarberService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES) || 
        localStorage.getItem('estudiovip_services_v7') || 
        localStorage.getItem('estudiovip_services_v6');
      if (saved) {
        const parsed: BarberService[] = JSON.parse(saved);
        return parsed.map((svc) => {
          const init = initialServices.find((s) => s.id === svc.id);
          // If it is one of the official default services, ensure the bundled original image is used
          if (init) {
            return { ...svc, imageUrl: init.imageUrl };
          }
          return svc;
        });
      }
      return initialServices;
    } catch {
      return initialServices;
    }
  });

  const [isSystemCleaned, setIsSystemCleaned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('estudiovip_clean_state_active') === 'true';
    } catch {
      return false;
    }
  });

  const [reviews, setReviews] = useState<BarberReview[]>(() => {
    try {
      const isCleaned = localStorage.getItem('estudiovip_clean_state_active') === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      if (saved) return JSON.parse(saved);
      return isCleaned ? [] : initialReviews;
    } catch {
      return [];
    }
  });

  // Status de funcionamento (Aberto/Fechado) e horários bloqueados são sincronizados exclusivamente via Supabase em tempo real
  const [settings, setSettings] = useState<BarbershopSettings>(initialSettings);

  // Agendamentos em Tempo Real: gerenciados e lidos exclusivamente da tabela 'appointments' do Supabase
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (saved) {
        const parsed: Announcement[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return initialAnnouncements;
    } catch {
      return initialAnnouncements;
    }
  });

  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Base de Clientes Cadastrados
  const [registeredClients, setRegisteredClients] = useState<RegisteredClient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      if (saved) {
        const parsed: RegisteredClient[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return defaultClients;
    } catch {
      return defaultClients;
    }
  });

  // Avisos Oficiais em Tempo Real da tabela 'notifications' do Supabase
  const [rawSupabaseNotifications, setRawSupabaseNotifications] = useState<SupabaseNotification[]>([]);
  const [notificationMetaById, setNotificationMetaById] = useState<Record<string, NotificationDurationMeta>>(
    () => getLocalNotificationMetaMap()
  );
  const [expirationTick, setExpirationTick] = useState<number>(() => Date.now());
  const lastManualStatusRef = useRef<'open' | 'closed' | 'auto'>('auto');

  useEffect(() => {
    const timer = setInterval(() => {
      setExpirationTick(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const supabaseNotifications = useMemo(() => {
    return rawSupabaseNotifications.map((n) => {
      const meta = notificationMetaById[String(n.id)];
      if (!meta) return n;
      return {
        ...n,
        type: n.type && n.type !== 'aviso' ? n.type : meta.type || n.type || 'aviso',
        expires_at: n.expires_at !== undefined ? n.expires_at : meta.expiresAt,
        duration_type: n.duration_type ?? meta.durationType,
        duration_label: n.duration_label ?? meta.durationLabel,
      };
    });
  }, [rawSupabaseNotifications, notificationMetaById]);

  const activeSupabaseNotifications = useMemo(() => {
    const now = new Date(expirationTick);
    return supabaseNotifications.filter((n) => isNotificationValid(n, now));
  }, [supabaseNotifications, expirationTick]);

  // Estado de Autenticação Global do Administrador (Protege contra vazamento de botões/portas/alertas antes do login)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('estudio_vip_admin_logged') === 'true';
    } catch {
      return false;
    }
  });

  // Default: Start with NO logged in user until client decides to book or login
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed: UserAccount = JSON.parse(saved);
        if (parsed && parsed.id && parsed.id !== 'usr-default' && parsed.name !== 'Rafael Oliveira') {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const [activeView, setActiveView] = useState<'client' | 'admin'>('client');
  const [clientActiveTab, setClientActiveTab] = useState<'home' | 'booking' | 'services' | 'my-appointments' | 'announcements' | 'barber'>('home');
  const [adminActiveTab, setAdminActiveTab] = useState<'overview' | 'appointments' | 'services' | 'schedule' | 'payments' | 'announcements' | 'cancellations' | 'reviews' | 'clients'>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    } catch (e) {
      console.error(e);
    }
  }, [services]);

  // Limpeza de cache legado de agendamentos e status no localStorage para usar estritamente o Supabase
  useEffect(() => {
    try {
      const legacyKeys = [
        'estudiovip_settings_v6',
        'estudiovip_settings_v5',
        'estudiovip_settings',
        'estudiovip_appointments_v9',
        'estudiovip_appointments_v8',
        'estudiovip_appointments_v7',
        'estudiovip_appointments_v6',
        'estudiovip_appointments',
        'estudio_vip_appointments',
      ];
      legacyKeys.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.error(e);
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(registeredClients));
    } catch (e) {
      console.error(e);
    }
  }, [registeredClients]);

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  // Função para recarregar agendamentos do Supabase sob demanda
  // Função para recarregar agendamentos e status do Supabase sob demanda
  const refreshSupabaseAppointments = async () => {
    try {
      const result = await fetchAppointmentsAndStatusFromSupabase();
      if (result) {
        setAppointments(result.appointments);
        if (result.statusConfig) {
          setSettings((prev) => ({
            ...prev,
            manualOverrideStatus: result.statusConfig!.manualOverrideStatus,
            blockedSlotsByDate: result.statusConfig!.blockedSlotsByDate || prev.blockedSlotsByDate,
            customUnlockedSlotsByDate: result.statusConfig!.customUnlockedSlotsByDate || prev.customUnlockedSlotsByDate,
          }));
        }
        setIsSupabaseConnected(true);
      }
    } catch (err) {
      console.warn('Erro ao atualizar agendamentos e status do Supabase:', err);
    }
  };

  // Integração com Supabase: Carregamento inicial e Realtime Channel para sincronizar celular e PC instantaneamente
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [result, supabaseClients, supabaseNotifs] = await Promise.all([
          fetchAppointmentsAndStatusFromSupabase(),
          fetchClientsFromSupabase(),
          fetchNotificationsFromSupabase(),
        ]);

        if (result && isMounted) {
          setAppointments(result.appointments);
          if (result.statusConfig) {
            lastManualStatusRef.current = result.statusConfig.manualOverrideStatus;
            setSettings((prev) => ({
              ...prev,
              manualOverrideStatus: result.statusConfig!.manualOverrideStatus,
              blockedSlotsByDate: result.statusConfig!.blockedSlotsByDate || prev.blockedSlotsByDate,
              customUnlockedSlotsByDate: result.statusConfig!.customUnlockedSlotsByDate || prev.customUnlockedSlotsByDate,
            }));
            if (result.statusConfig.notificationMetaById) {
              setNotificationMetaById((prev) => ({
                ...prev,
                ...result.statusConfig!.notificationMetaById,
              }));
            }
          }
          setIsSupabaseConnected(true);
        }

        // Sincroniza avisos em tempo real vindos da tabela 'notifications' do Supabase
        if (supabaseNotifs && Array.isArray(supabaseNotifs) && isMounted) {
          setRawSupabaseNotifications(supabaseNotifs);
        }

        // Sincroniza clientes vindos da tabela 'client' do Supabase
        if (supabaseClients && Array.isArray(supabaseClients) && supabaseClients.length > 0 && isMounted) {
          setRegisteredClients((prev) => {
            const list = [...prev];
            for (const sc of supabaseClients) {
              const name = (sc.name || sc.nome || '').trim();
              const phone = (sc.phone || sc.telefone || '').trim();
              const email = (sc.email || '').trim().toLowerCase();
              if (!name && !phone) continue;

              const cleanPhone = phone.replace(/\D/g, '');
              const existingIdx = list.findIndex(
                (c) =>
                  (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone) ||
                  (email && c.email?.toLowerCase() === email)
              );

              if (existingIdx >= 0) {
                list[existingIdx] = {
                  ...list[existingIdx],
                  name: name || list[existingIdx].name,
                  phone: phone || list[existingIdx].phone,
                  email: email || list[existingIdx].email,
                };
              } else {
                list.push({
                  id: String(sc.id || `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
                  name,
                  phone,
                  email: email || undefined,
                  createdAt: sc.created_at || new Date().toISOString(),
                  totalBookings: 1,
                  totalSpent: 0,
                });
              }
            }
            return list;
          });
        }
      } catch (e) {
        console.warn('Carregamento inicial do Supabase:', e);
      }
    };

    loadInitialData();

    // Inscrição 1: Canal Realtime para agendamentos e status da barbearia
    const unsubscribeAppointments = subscribeToAppointmentsRealtime(
      (newApt) => {
        setAppointments((prev) => {
          if (prev.some((a) => a.id === newApt.id)) {
            return prev.map((a) => (a.id === newApt.id ? newApt : a));
          }
          return [newApt, ...prev];
        });

        // Alimenta instantaneamente as notificações do painel do proprietário
        setNotifications((prev) => {
          if (prev.some((n) => n.appointmentId === newApt.id)) return prev;
          const newNotif: AdminNotification = {
            id: `notif-${Date.now()}`,
            title: '💈 Novo Agendamento Confirmado!',
            message: `${newApt.clientName} agendou ${newApt.serviceName} para ${newApt.date} às ${newApt.time}.`,
            timestamp: 'Agora mesmo',
            read: false,
            type: 'novo_agendamento',
            appointmentId: newApt.id,
          };
          return [newNotif, ...prev];
        });

        playNotificationChime();
        showToast(
          `Novo agendamento recebido: ${newApt.clientName} (${newApt.time})`,
          'info',
          '⚡ Supabase Realtime'
        );
      },
      (updatedApt) => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === updatedApt.id ? updatedApt : a))
        );
      },
      (deletedId) => {
        setAppointments((prev) => prev.filter((a) => a.id !== deletedId));
      },
      (status) => {
        if (status === 'SUBSCRIBED') {
          setIsSupabaseConnected(true);
        }
      },
      (statusConfig: BarbershopGlobalStatus) => {
        const previousOverride = lastManualStatusRef.current;
        const overrideChanged = statusConfig.manualOverrideStatus !== previousOverride;
        lastManualStatusRef.current = statusConfig.manualOverrideStatus;

        if (statusConfig.notificationMetaById) {
          setNotificationMetaById((prev) => ({
            ...prev,
            ...statusConfig.notificationMetaById,
          }));
        }

        setSettings((prev) => {
          let updatedWorkingDays = prev.workingDays;
          if (statusConfig.manualOverrideStatus === 'auto') {
            updatedWorkingDays = prev.workingDays.map((wd) => {
              if (wd.dayOfWeek === 0) {
                return { ...wd, active: false };
              }
              return wd;
            });
          }
          return {
            ...prev,
            manualOverrideStatus: statusConfig.manualOverrideStatus,
            blockedSlotsByDate: statusConfig.blockedSlotsByDate || prev.blockedSlotsByDate,
            customUnlockedSlotsByDate: statusConfig.customUnlockedSlotsByDate || prev.customUnlockedSlotsByDate,
            workingDays: updatedWorkingDays,
          };
        });

        if (overrideChanged) {
          playNotificationChime();
          showToast(
            statusConfig.manualOverrideStatus === 'open'
              ? 'Barbearia ABERTA em tempo real! Horários disponíveis.'
              : statusConfig.manualOverrideStatus === 'closed'
              ? 'Barbearia FECHADA em tempo real pelo proprietário!'
              : 'Barbearia em modo AUTOMÁTICO de expediente.',
            'info',
            '⚡ Supabase Sincronizado'
          );
        }
      }
    );

    // Inscrição 2: Canal Realtime para a tabela 'notifications' (Avisos do Barbeiro em Tempo Real)
    const unsubscribeNotifications = subscribeToNotificationsRealtime(
      (newNotif) => {
        console.log('⚡ [Realtime Notification Recebida pelo Cliente]:', newNotif);
        setRawSupabaseNotifications((prev) => {
          if (prev.some((n) => String(n.id) === String(newNotif.id))) return prev;
          return [newNotif, ...prev];
        });

        if (isNotificationValid(newNotif)) {
          // Som de sino suave de notificação
          playNotificationChime();

          // Alerta visual de aviso publicado pelo Mariano
          showToast(
            newNotif.message || newNotif.title,
            'info',
            `📢 ${newNotif.title}`
          );

          // Dispara notificação push nativa para clientes com permissão ativada
          sendPushNotificationToClients({
            title: `💈 ${newNotif.title}`,
            body: newNotif.message,
            type: 'aviso_geral',
            url: '/',
          }).catch(() => {});
        }
      },
      (deletedId) => {
        setRawSupabaseNotifications((prev) => prev.filter((n) => String(n.id) !== String(deletedId)));
      }
    );

    return () => {
      isMounted = false;
      unsubscribeAppointments();
      unsubscribeNotifications();
    };
  }, []);

  // Funções de Gestão de Avisos do Barbeiro (Tabela notifications)
  const refreshSupabaseNotifications = async (): Promise<void> => {
    try {
      const [data, statusResult] = await Promise.all([
        fetchNotificationsFromSupabase(),
        fetchAppointmentsAndStatusFromSupabase(),
      ]);
      if (statusResult?.statusConfig?.notificationMetaById) {
        setNotificationMetaById((prev) => ({
          ...prev,
          ...statusResult.statusConfig!.notificationMetaById,
        }));
      }
      if (data) {
        setRawSupabaseNotifications(data);
      }
      setExpirationTick(Date.now());
    } catch (e) {
      console.warn('Erro ao atualizar avisos do Supabase:', e);
    }
  };

  const sendBarberAnnouncement = async (
    title: string,
    message: string,
    type: string = 'aviso',
    durationType: NotificationDurationType = 'today',
    customMinutes: number = 60
  ): Promise<boolean> => {
    console.log('📢 [BarbershopContext.sendBarberAnnouncement] Iniciando envio com AWAIT para Supabase:', {
      title,
      message,
      type,
      durationType,
      customMinutes,
    });

    try {
      const created = await sendNotificationToSupabase({
        title,
        message,
        type,
        durationType,
        customMinutes,
      });
      if (created) {
        console.log('✅ [BarbershopContext.sendBarberAnnouncement] Sucesso retornado por sendNotificationToSupabase:', created);

        setNotificationMetaById((prev) => ({
          ...prev,
          [String(created.id)]: {
            durationType: created.duration_type || durationType,
            durationLabel: created.duration_label,
            expiresAt: created.expires_at ?? null,
            type: created.type || type,
            createdAt: created.created_at,
          },
        }));

        setRawSupabaseNotifications((prev) => [
          created,
          ...prev.filter((n) => String(n.id) !== String(created.id)),
        ]);

        showToast(
          'Aviso publicado com sucesso e transmitido em tempo real aos clientes!',
          'success',
          '⚡ Supabase Realtime'
        );

        // Notifica também os dispositivos com Web Push ativo
        sendPushNotificationToClients({
          title: `💈 ${title}`,
          body: message,
          type: 'aviso_geral',
          url: '/',
        }).catch(() => {});

        return true;
      }

      console.error('❌ [BarbershopContext.sendBarberAnnouncement] sendNotificationToSupabase retornou null.');
      showToast('Falha ao gravar aviso na tabela notifications do Supabase. Verifique o console.', 'error');
      return false;
    } catch (err) {
      console.error('❌ [BarbershopContext.sendBarberAnnouncement] Exceção capturada:', err);
      showToast('Erro ao transmitir aviso aos clientes.', 'error');
      return false;
    }
  };

  const deleteBarberAnnouncement = async (id: string | number): Promise<boolean> => {
    try {
      const ok = await deleteNotificationFromSupabase(id);
      if (ok) {
        setRawSupabaseNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
        setNotificationMetaById((prev) => {
          const next = { ...prev };
          delete next[String(id)];
          return next;
        });
        showToast('Aviso removido da tabela notifications do Supabase.', 'info');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao excluir comunicado:', err);
      return false;
    }
  };

  // Admin Auth Helpers
  const adminLogin = (user: string, pass: string): boolean => {
    const validUser = (import.meta.env.VITE_ADMIN_USER || 'estudiomariamiguel123').trim();
    const validPass = (import.meta.env.VITE_ADMIN_PASS || 'barbeirotop1590').trim();

    if (user.trim() === validUser && pass.trim() === validPass) {
      sessionStorage.setItem('estudio_vip_admin_logged', 'true');
      setIsAdminLoggedIn(true);
      showToast('Bem-vindo ao Painel Administrativo, Mariano!', 'success', 'Acesso Autorizado');
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    sessionStorage.removeItem('estudio_vip_admin_logged');
    setIsAdminLoggedIn(false);
    showToast('Sessão encerrada com sucesso.', 'info', 'Logout');
  };

  // Registered Clients Management
  const deleteRegisteredClient = (id: string) => {
    setRegisteredClients((prev) => prev.filter((c) => c.id !== id));
    showToast('Cliente removido da base cadastral.', 'info', 'Cadastro Atualizado');
  };

  const addOrUpdateRegisteredClient = (data: Partial<RegisteredClient> & { name: string; phone: string }): RegisteredClient => {
    let result: RegisteredClient;
    setRegisteredClients((prev) => {
      const cleanPhone = data.phone.trim();
      const existingIndex = prev.findIndex(
        (c) =>
          c.id === data.id ||
          (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) ||
          (data.email && c.email?.toLowerCase() === data.email.toLowerCase())
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        result = {
          ...updated[existingIndex],
          ...data,
          name: data.name.trim() || updated[existingIndex].name,
          phone: cleanPhone || updated[existingIndex].phone,
        };
        updated[existingIndex] = result;
        return updated;
      } else {
        result = {
          id: data.id || `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: data.name.trim(),
          phone: cleanPhone,
          email: data.email?.trim() || undefined,
          createdAt: new Date().toISOString(),
          totalBookings: data.totalBookings || 0,
          totalSpent: data.totalSpent || 0,
          lastBookingDate: data.lastBookingDate,
        };
        return [result, ...prev];
      }
    });
    // Salva na tabela 'client' do Supabase com await
    if (result! && result!.name && (result!.phone || result!.email)) {
      (async () => {
        try {
          await insertClientIfNotExistsToSupabase({
            name: result!.name,
            phone: result!.phone,
            email: result!.email,
          });
        } catch (e) {
          console.error('❌ [addOrUpdateRegisteredClient] Erro ao sincronizar cliente com Supabase:', e);
        }
      })();
    }

    return result!;
  };

  // Toast helper
  const showToast = (message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper para persistir o status e horários no Supabase em tempo real
  const syncSettingsToSupabase = (s: BarbershopSettings) => {
    lastManualStatusRef.current = s.manualOverrideStatus || 'auto';
    saveBarbershopStatusToSupabase({
      manualOverrideStatus: s.manualOverrideStatus || 'auto',
      blockedSlotsByDate: s.blockedSlotsByDate || {},
      customUnlockedSlotsByDate: s.customUnlockedSlotsByDate || {},
      notificationMetaById,
    });
  };

  // Owner manual toggle for Open / Closed
  const setManualBarbershopStatus = (status: 'open' | 'closed' | 'auto') => {
    setSettings((prev) => {
      // When resetting to auto mode, ensure Sunday reverts to closed automatically by default (norma da casa)
      let updatedWorkingDays = prev.workingDays;
      if (status === 'auto') {
        updatedWorkingDays = prev.workingDays.map((wd) => {
          if (wd.dayOfWeek === 0) {
            return { ...wd, active: false };
          }
          return wd;
        });
      }
      const updated = {
        ...prev,
        manualOverrideStatus: status,
        workingDays: updatedWorkingDays,
      };

      // Salva no Supabase em tempo real para sincronizar PC e celular instantaneamente
      syncSettingsToSupabase(updated);

      return updated;
    });

    if (status === 'open') {
      showToast('Barbearia ativada como ABERTA! Horários liberados em tempo real no PC e telemóvel.', 'success', 'Expediente Aberto');
    } else if (status === 'closed') {
      showToast('Barbearia desativada como FECHADA pelo proprietário!', 'warning', 'Expediente Fechado');
    } else {
      showToast('Barbearia voltou para o modo AUTOMÁTICO de expediente (domingo fechado por norma da casa).', 'info', 'Status Automático');
    }
  };

  // Barbershop Status check with manual owner override
  const isOpenNow = () => {
    const override = settings.manualOverrideStatus;

    if (override === 'open') {
      return {
        isOpen: true,
        message: 'Aberto agora (Confirmado pelo barbeiro)',
        isManualOverride: true,
        manualStatus: 'open' as const,
      };
    }

    if (override === 'closed') {
      return {
        isOpen: false,
        message: 'Fechado no momento pelo proprietário',
        isManualOverride: true,
        manualStatus: 'closed' as const,
      };
    }

    const now = new Date();
    const currentDayOfWeek = now.getDay();
    const todayConfig = settings.workingDays.find((d) => d.dayOfWeek === currentDayOfWeek);

    // House rule: Sunday (dayOfWeek === 0) is closed automatically by default
    if (currentDayOfWeek === 0 || !todayConfig || !todayConfig.active) {
      return { 
        isOpen: false, 
        message: currentDayOfWeek === 0 ? 'Fechado hoje (Descanso semanal - Norma da casa)' : 'Fechado hoje (Descanso semanal)', 
        todayConfig,
        manualStatus: 'auto' as const
      };
    }

    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (currentHourMin < todayConfig.openTime) {
      return { 
        isOpen: false, 
        message: `Fechado. Abre hoje às ${todayConfig.openTime}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    if (todayConfig.hasLunchBreak && currentHourMin >= todayConfig.lunchStart && currentHourMin < todayConfig.lunchEnd) {
      return { 
        isOpen: false, 
        message: `Em intervalo de almoço até ${todayConfig.lunchEnd}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    if (currentHourMin >= todayConfig.closeTime) {
      return { 
        isOpen: false, 
        message: `Fechado por hoje. Aberto até às ${todayConfig.closeTime}`, 
        todayConfig,
        manualStatus: 'auto' as const 
      };
    }

    return { 
      isOpen: true, 
      message: `Aberto hoje até às ${todayConfig.closeTime}`, 
      todayConfig,
      manualStatus: 'auto' as const 
    };
  };

  // Helper to convert HH:mm to minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (mins || 0);
  };

  // Helper to convert minutes to HH:mm string
  const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Helper to add minutes to HH:mm string
  const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Slot customization by owner (Disponibilizar / Tirar Horários)
  const isSlotBlockedByOwner = (dateString: string, timeSlot: string): boolean => {
    return (settings.blockedSlotsByDate?.[dateString] || []).includes(timeSlot);
  };

  const isSlotLunchUnlocked = (dateString: string, timeSlot: string): boolean => {
    return (settings.customUnlockedSlotsByDate?.[dateString] || []).includes(timeSlot);
  };

  const toggleSlotBlocked = (dateString: string, timeSlot: string) => {
    const currentlyBlocked = settings.blockedSlotsByDate?.[dateString] || [];
    const isAlreadyBlocked = currentlyBlocked.includes(timeSlot);
    const updated = isAlreadyBlocked
      ? currentlyBlocked.filter((s) => s !== timeSlot)
      : [...currentlyBlocked, timeSlot];

    setSettings((prev) => {
      const updatedSettings = {
        ...prev,
        blockedSlotsByDate: {
          ...(prev.blockedSlotsByDate || {}),
          [dateString]: updated,
        },
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });

    if (isAlreadyBlocked) {
      showToast(`Horário das ${timeSlot} disponibilizado para agendamento!`, 'success', 'Horário Liberado');
    } else {
      showToast(`Horário das ${timeSlot} retirado da agenda pelo proprietário.`, 'warning', 'Horário Tirado da Agenda');
    }
  };

  const blockMultipleSlots = (dateString: string, slotsToBlock: string[]) => {
    setSettings((prev) => {
      const currentBlocked = prev.blockedSlotsByDate?.[dateString] || [];
      const merged = Array.from(new Set([...currentBlocked, ...slotsToBlock]));
      const updatedSettings = {
        ...prev,
        blockedSlotsByDate: {
          ...(prev.blockedSlotsByDate || {}),
          [dateString]: merged,
        },
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });
    showToast(`${slotsToBlock.length} horários foram retirados da agenda.`, 'warning', 'Horários Bloqueados');
  };

  const unblockMultipleSlots = (dateString: string, slotsToUnblock: string[]) => {
    setSettings((prev) => {
      const currentBlocked = prev.blockedSlotsByDate?.[dateString] || [];
      const updated = currentBlocked.filter((s) => !slotsToUnblock.includes(s));
      const updatedSettings = {
        ...prev,
        blockedSlotsByDate: {
          ...(prev.blockedSlotsByDate || {}),
          [dateString]: updated,
        },
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });
    showToast(`${slotsToUnblock.length} horários foram disponibilizados na agenda!`, 'success', 'Horários Liberados');
  };

  const blockAllSlotsForDate = (dateString: string) => {
    const allSlots = getAvailableSlots(dateString).map((s) => s.time);
    setSettings((prev) => {
      const updatedSettings = {
        ...prev,
        blockedSlotsByDate: {
          ...(prev.blockedSlotsByDate || {}),
          [dateString]: allSlots,
        },
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });
    showToast('Todos os horários desta data foram bloqueados na agenda.', 'warning', 'Agenda Bloqueada');
  };

  const unblockAllSlotsForDate = (dateString: string) => {
    setSettings((prev) => {
      const nextMap = { ...(prev.blockedSlotsByDate || {}) };
      delete nextMap[dateString];
      const updatedSettings = {
        ...prev,
        blockedSlotsByDate: nextMap,
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });
    showToast('Todos os horários desta data foram disponibilizados para os clientes!', 'success', 'Agenda Totalmente Liberada');
  };

  const toggleLunchSlotUnlocked = (dateString: string, timeSlot: string) => {
    const currentlyUnlocked = settings.customUnlockedSlotsByDate?.[dateString] || [];
    const isUnlocked = currentlyUnlocked.includes(timeSlot);
    const updated = isUnlocked
      ? currentlyUnlocked.filter((s) => s !== timeSlot)
      : [...currentlyUnlocked, timeSlot];

    setSettings((prev) => {
      const updatedSettings = {
        ...prev,
        customUnlockedSlotsByDate: {
          ...(prev.customUnlockedSlotsByDate || {}),
          [dateString]: updated,
        },
      };
      syncSettingsToSupabase(updatedSettings);
      return updatedSettings;
    });

    if (isUnlocked) {
      showToast(`Horário das ${timeSlot} voltou ao intervalo de almoço fechado.`, 'info');
    } else {
      showToast(`Horário das ${timeSlot} liberado para atendimento no almoço!`, 'success', 'Almoço Aberto');
    }
  };

  const togglePastSlotUnlocked = (dateString: string, timeSlot: string) => {
    const currentlyUnlocked = settings.customUnlockedSlotsByDate?.[dateString] || [];
    const isUnlocked = currentlyUnlocked.includes(timeSlot);
    const updated = isUnlocked
      ? currentlyUnlocked.filter((s) => s !== timeSlot)
      : [...currentlyUnlocked, timeSlot];

    setSettings((prev) => ({
      ...prev,
      customUnlockedSlotsByDate: {
        ...(prev.customUnlockedSlotsByDate || {}),
        [dateString]: updated,
      },
    }));

    if (isUnlocked) {
      showToast(`Horário das ${timeSlot} retornou ao status passado (indisponível).`, 'info');
    } else {
      showToast(`Horário das ${timeSlot} reativado manualmente para ENCAIXE!`, 'success', 'Encaixe Liberado');
    }
  };

  const addCustomSlot = (dateString: string, timeSlot: string) => {
    const trimmed = timeSlot.trim();
    if (!/^\d{1,2}:\d{2}$/.test(trimmed)) {
      showToast('Formato inválido. Digite o horário no formato HH:mm (ex: 17:10).', 'error');
      return;
    }
    const [h, m] = trimmed.split(':').map(Number);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      showToast('Horário fora dos limites válidos (00:00 às 23:59).', 'error');
      return;
    }
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    setSettings((prev) => {
      const current = prev.customExtraSlotsByDate?.[dateString] || [];
      if (current.includes(formatted)) {
        return prev;
      }
      const updated = [...current, formatted].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      return {
        ...prev,
        customExtraSlotsByDate: {
          ...(prev.customExtraSlotsByDate || {}),
          [dateString]: updated,
        },
      };
    });
    showToast(`Horário ${formatted} adicionado com sucesso para esta data!`, 'success', 'Horário Criado');
  };

  const removeCustomSlot = (dateString: string, timeSlot: string) => {
    setSettings((prev) => {
      const current = prev.customExtraSlotsByDate?.[dateString] || [];
      const updated = current.filter((s) => s !== timeSlot);
      return {
        ...prev,
        customExtraSlotsByDate: {
          ...(prev.customExtraSlotsByDate || {}),
          [dateString]: updated,
        },
      };
    });
    showToast(`Horário ${timeSlot} removido da agenda.`, 'info');
  };

  const setSlotIntervalMinutes = (intervalMinutes: number) => {
    const valid = [15, 20, 30, 45, 60].includes(intervalMinutes) ? intervalMinutes : 30;
    setSettings((prev) => ({
      ...prev,
      slotIntervalMinutes: valid,
      slotDurationMinutes: valid,
    }));
    showToast(`Intervalo da agenda alterado para ${valid} minutos!`, 'success', 'Intervalo Atualizado');
  };

  // Generate available slots for a given date string (YYYY-MM-DD)
  // Total freedom for the barber: customizable interval (15, 20, 30, 45, 60 min) + custom extra slots (ex: 17:10, 17:20)
  const getAvailableSlots = (dateString: string, requestedDuration?: number): SlotAvailability[] => {
    // Parse target date to get day of week
    const [year, month, day] = dateString.split('-').map(Number);
    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    const todayStr = getTodayString();
    const isTargetToday = dateString === todayStr;
    const isManuallyOpenToday = isTargetToday && settings.manualOverrideStatus === 'open';
    const isManuallyClosedToday = isTargetToday && settings.manualOverrideStatus === 'closed';

    // If owner explicitly closed today via manual toggle, no slots available today
    if (isManuallyClosedToday) {
      return [];
    }

    const dayConfig = settings.workingDays.find((d) => d.dayOfWeek === dayOfWeek);

    // Rule: Sunday (dayOfWeek === 0) is closed automatically by default unless owner activated today or enabled in working days
    if (!isManuallyOpenToday) {
      if (!dayConfig || !dayConfig.active) {
        return [];
      }
    }

    const openTime = dayConfig?.openTime || '08:30';
    const closeTime = dayConfig?.closeTime || '19:00';
    const hasLunchBreak = dayConfig !== undefined ? dayConfig.hasLunchBreak : true;
    const lunchStart = dayConfig?.lunchStart || '12:00';
    const lunchEnd = dayConfig?.lunchEnd || '14:00';

    const startMinutes = timeToMinutes(openTime);
    const endMinutes = timeToMinutes(closeTime);
    const lunchStartMin = timeToMinutes(lunchStart);
    const lunchEndMin = timeToMinutes(lunchEnd);

    const blockedList = settings.blockedSlotsByDate?.[dateString] || [];
    const unlockedCustomList = settings.customUnlockedSlotsByDate?.[dateString] || [];
    const extraCustomList = settings.customExtraSlotsByDate?.[dateString] || [];

    // Active booked appointments on this date
    const activeAppointmentsOnDate = appointments.filter((apt) => {
      return (
        apt.date === dateString &&
        ['agendado', 'confirmado_presenca', 'em_atendimento', 'concluido'].includes(apt.status)
      );
    });

    // Map each active booking to its interval [start, end)
    const bookedIntervals = activeAppointmentsOnDate.map((apt) => {
      const aptStart = timeToMinutes(apt.time);
      const dur = apt.serviceDuration || (apt.services && apt.services.length > 0 ? apt.services.reduce((acc, s) => acc + s.durationMinutes, 0) : 30);
      const aptEnd = aptStart + dur;
      return {
        apt,
        start: aptStart,
        end: aptEnd,
        time: apt.time,
        endTime: minutesToTime(aptEnd),
        duration: dur,
      };
    });

    // Candidate minute generation: step interval selected by barber (default 30 min, or 15, 20, 45, 60 min)
    const stepInterval = settings.slotIntervalMinutes || settings.slotDurationMinutes || 30;
    const candidateMinuteSet = new Set<number>();

    for (let m = startMinutes; m <= endMinutes; m += stepInterval) {
      candidateMinuteSet.add(m);
    }

    // Include barber's custom extra slots (e.g., 17:10, 17:20)
    extraCustomList.forEach((slotStr) => {
      const min = timeToMinutes(slotStr);
      if (!isNaN(min)) {
        candidateMinuteSet.add(min);
      }
    });

    // Include appointment end times so openings between bookings are available
    bookedIntervals.forEach((b) => {
      if (b.end >= startMinutes && b.end <= endMinutes) {
        candidateMinuteSet.add(b.end);
      }
    });

    const sortedMinutes = Array.from(candidateMinuteSet).sort((a, b) => a - b);
    const slots: SlotAvailability[] = [];

    // Current device time check for past slots on today's schedule
    const now = new Date();
    const currentDeviceMinutes = now.getHours() * 60 + now.getMinutes();
    const durationToCheck = requestedDuration && requestedDuration > 0 ? requestedDuration : 30;

    for (const m of sortedMinutes) {
      const currentSlot = minutesToTime(m);
      const isBlockedByOwner = blockedList.includes(currentSlot);
      const isLunchTime = hasLunchBreak && m >= lunchStartMin && m < lunchEndMin;
      const isLunchUnlocked = unlockedCustomList.includes(currentSlot);
      const isLunch = isLunchTime && !isLunchUnlocked;
      const isCustomExtra = extraCustomList.includes(currentSlot);

      // Horário já passou hoje? (ex: são 16:00, horários até 15:30 já passaram)
      const isPast = isTargetToday && m < currentDeviceMinutes;
      const isUnlockedForEncaixe = unlockedCustomList.includes(currentSlot);

      // 1. Is this slot inside an ongoing service?
      const occupyingBooking = bookedIntervals.find((b) => m >= b.start && m < b.end);

      if (occupyingBooking) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          appointment: occupyingBooking.apt,
          isLunchBreak: false,
          isBlockedByOwner: false,
          isPast,
          isCustomExtra,
          occupiedUntil: occupyingBooking.endTime,
          unavailableReason: `Em atendimento (${occupyingBooking.apt.serviceName}) até às ${occupyingBooking.endTime}`,
        });
        continue;
      }

      // 2. Is this slot inside lunch break? (12:00 - 14:00)
      if (isLunch && !isCustomExtra) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: true,
          isBlockedByOwner: false,
          isPast,
          isCustomExtra,
          unavailableReason: 'Intervalo de Almoço (12:00 às 14:00)',
        });
        continue;
      }

      // 3. Has owner manually blocked this slot?
      if (isBlockedByOwner) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: false,
          isBlockedByOwner: true,
          isPast,
          isCustomExtra,
          unavailableReason: 'Indisponibilizado pelo barbeiro',
        });
        continue;
      }

      // 4. Has this slot already elapsed today?
      if (isPast && !isUnlockedForEncaixe && !isCustomExtra) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: false,
          isBlockedByOwner: false,
          isPast: true,
          isCustomExtra,
          isUnlockedForEncaixe: false,
          unavailableReason: 'Horário já transcorrido',
        });
        continue;
      }

      // 5. Check if requested duration fits before next appointment or closing
      const plannedEnd = m + durationToCheck;
      let durationConflict: string | undefined;

      const nextBookingConflict = bookedIntervals.find((b) => Math.max(m, b.start) < Math.min(plannedEnd, b.end));
      if (nextBookingConflict) {
        durationConflict = `Tempo insuficiente (${durationToCheck} min). Próximo cliente às ${nextBookingConflict.time}.`;
      } else if (hasLunchBreak && !isLunchUnlocked && m < lunchStartMin && plannedEnd > lunchStartMin && !isCustomExtra) {
        durationConflict = `Tempo insuficiente (${durationToCheck} min) antes do almoço (12:00). À tarde recomeça normal às 14:00.`;
      } else if (plannedEnd > endMinutes && !isCustomExtra) {
        durationConflict = `Ultrapassa o horário de fechamento (${closeTime}).`;
      }

      if (durationConflict) {
        slots.push({
          time: currentSlot,
          isAvailable: false,
          isLunchBreak: false,
          isBlockedByOwner: false,
          isPast,
          isCustomExtra,
          unavailableReason: durationConflict,
        });
      } else {
        slots.push({
          time: currentSlot,
          isAvailable: true,
          isLunchBreak: false,
          isBlockedByOwner: false,
          isPast,
          isCustomExtra,
          isUnlockedForEncaixe: !!(isPast && isUnlockedForEncaixe),
        });
      }
    }

    return slots;
  };

  // Create Appointment (Supports Single or Multi-Service Combos & 50% reservation guarantee)
  const createAppointment = ({
    serviceId,
    serviceIds,
    clientName,
    clientPhone,
    clientEmail,
    date,
    time,
    paymentType,
    paymentMethod,
    depositAmount,
    remainingAmount,
    remainingPaymentMethod,
    notes,
  }: {
    serviceId?: string;
    serviceIds?: string[];
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    date: string;
    time: string;
    paymentType: 'antecipado' | 'presencial' | 'sinal_50';
    paymentMethod: PaymentMethod;
    depositAmount?: number;
    remainingAmount?: number;
    remainingPaymentMethod?: PaymentMethod;
    notes?: string;
  }): Appointment | null => {
    // Resolve all selected services
    const resolvedIds = serviceIds && serviceIds.length > 0 ? serviceIds : (serviceId ? [serviceId] : []);
    const chosenServices = services.filter((s) => resolvedIds.includes(s.id));

    if (chosenServices.length === 0) {
      showToast('Nenhum serviço válido foi selecionado.', 'error');
      return null;
    }

    const primaryService = chosenServices[0];
    const totalPrice = chosenServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = chosenServices.reduce((sum, s) => sum + s.durationMinutes, 0);
    const combinedName = chosenServices.map((s) => s.name).join(' + ');
    const serviceItems = chosenServices.map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      durationMinutes: s.durationMinutes,
    }));

    // Double check if slot was removed from agenda by the owner
    const isBlocked = (settings.blockedSlotsByDate?.[date] || []).includes(time);
    if (isBlocked) {
      showToast(`O horário das ${time} foi retirado da agenda pelo barbeiro. Por favor, escolha outro horário livre.`, 'error', 'Horário Indisponível');
      return null;
    }

    // Double check duration conflict with existing appointments on the same date
    const newStart = timeToMinutes(time);
    const newEnd = newStart + totalDuration;

    const hasConflict = appointments.some((apt) => {
      if (apt.date !== date) return false;
      if (!['agendado', 'confirmado_presenca', 'em_atendimento', 'concluido'].includes(apt.status)) return false;
      const aptStart = timeToMinutes(apt.time);
      const aptDur = apt.serviceDuration || (apt.services && apt.services.length > 0 ? apt.services.reduce((acc, s) => acc + s.durationMinutes, 0) : 30);
      const aptEnd = aptStart + aptDur;
      return Math.max(newStart, aptStart) < Math.min(newEnd, aptEnd);
    });

    if (hasConflict) {
      showToast(`O horário das ${time} coincide com outro atendimento em andamento. Por favor, escolha outro horário livre.`, 'error', 'Horário Indisponível');
      return null;
    }

    const toleranceExpiry = addMinutesToTime(time, settings.toleranceMinutes || 10);
    
    // Deposit calculation
    const calcDeposit = paymentType === 'sinal_50' ? (depositAmount || totalPrice * 0.5) : (paymentType === 'antecipado' ? totalPrice : 0);
    const calcRemaining = paymentType === 'sinal_50' ? (remainingAmount || totalPrice * 0.5) : 0;
    const calcStatus = paymentType === 'antecipado' ? 'pago' : (paymentType === 'sinal_50' ? 'sinal_pago' : 'pendente');

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      clientName,
      clientPhone,
      clientEmail,
      serviceId: primaryService.id,
      serviceName: combinedName,
      servicePrice: totalPrice,
      serviceDuration: totalDuration,
      serviceIds: resolvedIds,
      services: serviceItems,
      date,
      time,
      toleranceExpiryTime: toleranceExpiry,
      paymentType,
      paymentMethod,
      paymentStatus: calcStatus,
      depositAmount: calcDeposit,
      remainingAmount: calcRemaining,
      remainingPaymentMethod: paymentType === 'sinal_50' ? remainingPaymentMethod : undefined,
      status: 'agendado',
      createdAt: new Date().toISOString(),
      notes,
    };

    setAppointments((prev) => [newAppointment, ...prev]);

    // Persiste no Supabase com AWAIT explícito e tratamento de erro detalhado
    (async () => {
      try {
        console.log(`💈 [createAppointment] Iniciando persistência no Supabase para ${clientName}...`);

        // 1. Await na inserção do cliente na tabela 'client'
        const clientInserted = await insertClientIfNotExistsToSupabase({
          name: clientName,
          phone: clientPhone,
          email: clientEmail,
        });
        console.log(`💈 [createAppointment] Status da gravação do cliente na tabela 'client':`, clientInserted);

        // 2. Await na inserção do agendamento na tabela 'appointments'
        const apptInserted = await insertAppointmentToSupabase(newAppointment);
        if (apptInserted) {
          setIsSupabaseConnected(true);
        }
      } catch (saveErr) {
        console.error('❌ [createAppointment] Falha na persistência assíncrona com o Supabase:', saveErr);
      }
    })();

    // Atualiza ou insere cliente na base de clientes cadastrados
    setRegisteredClients((prev) => {
      const cleanPhone = clientPhone.trim();
      const existingIdx = prev.findIndex(
        (c) =>
          (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) ||
          (clientEmail && c.email?.toLowerCase() === clientEmail.toLowerCase())
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          name: clientName || copy[existingIdx].name,
          phone: cleanPhone || copy[existingIdx].phone,
          email: clientEmail || copy[existingIdx].email,
          lastBookingDate: date,
          totalBookings: (copy[existingIdx].totalBookings || 0) + 1,
          totalSpent: (copy[existingIdx].totalSpent || 0) + totalPrice,
        };
        return copy;
      } else {
        const newRegClient: RegisteredClient = {
          id: `cli-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: clientName,
          phone: cleanPhone,
          email: clientEmail || undefined,
          createdAt: new Date().toISOString(),
          lastBookingDate: date,
          totalBookings: 1,
          totalSpent: totalPrice,
        };
        return [newRegClient, ...prev];
      }
    });

    // Mantém o usuário ativo salvo no aparelho do cliente
    if (!currentUser || currentUser.name !== clientName) {
      const userObj: UserAccount = {
        id: currentUser?.id || `usr-${Date.now()}`,
        name: clientName,
        phone: clientPhone,
        email: clientEmail || '',
        isLoggedIn: true,
      };
      setCurrentUser(userObj);
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userObj));
      } catch (e) {
        console.error(e);
      }
    }

    // Push simulated notification to owner
    const paymentLabel = paymentType === 'sinal_50'
      ? `Sinal Pix de Garantia 50% (R$ ${calcDeposit.toFixed(2).replace('.', ',')}) + R$ ${calcRemaining.toFixed(2).replace('.', ',')} presencial`
      : paymentType === 'antecipado'
      ? `Integral 100% via Pix (R$ ${totalPrice.toFixed(2).replace('.', ',')})`
      : 'Pagamento Presencial';

    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: '💈 Novo Agendamento Confirmado!',
      message: `${clientName} agendou ${combinedName} (${totalDuration} min - R$ ${totalPrice.toFixed(2).replace('.', ',')}) para ${date} às ${time} [${paymentLabel}].`,
      timestamp: 'Agora mesmo',
      read: false,
      type: 'novo_agendamento',
      appointmentId: newAppointment.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Dispara notificação push e aviso sonoro para os aparelhos conectados (conecta cliente <-> barbeiro)
    sendPushNotificationToClients({
      title: '💈 Novo Agendamento - Estúdio VIP',
      body: `${clientName} agendou ${combinedName} para ${date} às ${time}.`,
      type: 'novo_agendamento',
      clientName,
      appointmentId: newAppointment.id,
    });

    showToast(
      `Agendamento para ${time} confirmado! Lembre-se: tolerância de 10 minutos.`,
      'success',
      'Reserva Confirmada!'
    );

    return newAppointment;
  };

  // Cancel Appointment
  const cancelAppointment = (id: string, reason: string, isFromAdmin = false) => {
    const status: AppointmentStatus = isFromAdmin ? 'cancelado_barbearia' : 'cancelado_cliente';
    const cancelledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          return {
            ...apt,
            status,
            cancellationReason: reason,
            cancelledAt,
          };
        }
        return apt;
      })
    );

    // Sincroniza cancelamento no Supabase
    updateAppointmentInSupabase(id, {
      status,
      cancellationReason: reason,
      cancelledAt,
    });

    const cancelledApt = appointments.find((a) => a.id === id);
    if (cancelledApt) {
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        title: 'Cancelamento de Horário',
        message: `O agendamento de ${cancelledApt.clientName} (${cancelledApt.time}) foi cancelado. Horário liberado na agenda.`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'cancelamento_cliente',
        appointmentId: id,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Dispara push notification para manter cliente e barbeiro alinhados
      sendPushNotificationToClients({
        title: isFromAdmin ? '✂️ Aviso da Barbearia Estúdio VIP' : '✂️ Horário Desmarcado',
        body: isFromAdmin
          ? `Seu agendamento das ${cancelledApt.time} foi alterado/cancelado pelo barbeiro: ${reason}`
          : `O horário das ${cancelledApt.time} de ${cancelledApt.clientName} foi desmarcado e está liberado.`,
        type: 'cancelamento',
        clientName: cancelledApt.clientName,
        appointmentId: id,
      });
    }

    showToast('Agendamento cancelado com sucesso. O horário foi liberado na agenda.', 'info', 'Cancelamento Efetuado');
  };

  // Simulate Delay Exceeded and Auto-Cancel
  const simulateDelayAndCancel = (id: string) => {
    let affectedApt: Appointment | undefined;
    const cancelledAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reason = `Cancelamento automático: tolerância de ${settings.toleranceMinutes} minutos ultrapassada sem comparecimento do cliente.`;

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          affectedApt = apt;
          return {
            ...apt,
            status: 'cancelado_atraso',
            cancellationReason: reason,
            cancelledAt,
          };
        }
        return apt;
      })
    );

    // Sincroniza cancelamento por atraso no Supabase
    updateAppointmentInSupabase(id, {
      status: 'cancelado_atraso',
      cancellationReason: reason,
      cancelledAt,
    });

    if (affectedApt) {
      const newNotif: AdminNotification = {
        id: `notif-${Date.now()}`,
        title: '⚠️ Cancelamento Automático por Atraso',
        message: `O cliente ${affectedApt.clientName} não compareceu dentro da tolerância de 10 min das ${affectedApt.time}. Horário liberado para outros clientes!`,
        timestamp: 'Agora mesmo',
        read: false,
        type: 'cancelamento_atraso',
        appointmentId: id,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      showToast(
        `Agendamento de ${affectedApt.clientName} cancelado por tolerância de 10 min excedida. Horário das ${affectedApt.time} liberado!`,
        'warning',
        'Tolerância Ultrapassada'
      );
    }
  };

  // Client Check-in confirmation
  const checkInAppointment = (id: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'confirmado_presenca',
              checkedInAt: timeNow,
            }
          : apt
      )
    );

    // Sincroniza check-in no Supabase
    updateAppointmentInSupabase(id, {
      status: 'confirmado_presenca',
      checkedInAt: timeNow,
    });

    showToast('Presença do cliente confirmada no balcão!', 'success', 'Check-in Realizado');
  };

  // Complete Appointment
  const completeAppointment = (id: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              status: 'concluido',
              paymentStatus: 'pago',
              completedAt: timeNow,
            }
          : apt
      )
    );

    // Sincroniza conclusão no Supabase
    updateAppointmentInSupabase(id, {
      status: 'concluido',
      paymentStatus: 'pago',
      completedAt: timeNow,
    });

    showToast('Atendimento finalizado com sucesso!', 'success', 'Concluído');
  };

  // Register payment
  const registerPayment = (id: string, method: PaymentMethod, status: PaymentStatus) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? {
              ...apt,
              paymentMethod: method,
              paymentStatus: status,
            }
          : apt
      )
    );

    // Sincroniza pagamento no Supabase
    updateAppointmentInSupabase(id, {
      paymentMethod: method,
      paymentStatus: status,
    });

    showToast('Pagamento registrado com sucesso!', 'success', 'Financeiro Atualizado');
  };

  // Services actions
  const addService = (newServiceData: Omit<BarberService, 'id'>) => {
    const newService: BarberService = {
      ...newServiceData,
      id: `srv-${Date.now()}`,
    };
    setServices((prev) => [...prev, newService]);
    showToast(`Serviço "${newService.name}" adicionado com sucesso!`, 'success');
  };

  const updateService = (id: string, updatedFields: Partial<BarberService>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
    );
    showToast('Serviço atualizado!', 'success');
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast('Serviço removido.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: Partial<BarbershopSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Configurações da barbearia atualizadas!', 'success');
  };

  const updateWorkingDay = (dayOfWeek: number, config: Partial<WorkingDayConfig>) => {
    setSettings((prev) => ({
      ...prev,
      workingDays: prev.workingDays.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, ...config } : d
      ),
    }));
    showToast('Horário de funcionamento atualizado!', 'success');
  };

  // Announcements
  const addAnnouncement = (newAnn: Omit<Announcement, 'id'>) => {
    const ann: Announcement = {
      ...newAnn,
      id: `anc-${Date.now()}`,
    };
    setAnnouncements((prev) => [ann, ...prev]);

    // Dispara push notification para todos os clientes cadastrados
    sendPushNotificationToClients({
      title: `📢 Comunicado da Barbearia: ${ann.title}`,
      body: ann.content,
      type: 'aviso_geral',
    });

    showToast('Novo comunicado publicado no Mural de Avisos!', 'success');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('Aviso removido.', 'info');
  };

  const toggleAnnouncement = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Auth & Client Profile
  const loginClient = (phoneOrEmail: string, name?: string, email?: string, password?: string) => {
    const isEmail = phoneOrEmail.includes('@');
    const inputClean = phoneOrEmail.trim();

    // Look up existing in registeredClients
    const cleanDigits = inputClean.replace(/\D/g, '');
    const existing = registeredClients.find((c) => {
      const matchEmail = (isEmail && c.email?.toLowerCase() === inputClean.toLowerCase()) || 
                          (email && c.email?.toLowerCase() === email.toLowerCase());
      const matchPhone = !isEmail && cleanDigits.length >= 8 && c.phone.replace(/\D/g, '').includes(cleanDigits);
      return matchEmail || matchPhone;
    });

    let cleanName = '';
    if (name && name.trim() && name.trim() !== 'Cliente Cadastrado' && name.trim() !== 'Cliente Estúdio VIP') {
      cleanName = name.trim();
    } else if (existing && existing.name && existing.name !== 'Cliente Cadastrado') {
      cleanName = existing.name;
    } else if (isEmail) {
      const userPart = inputClean.split('@')[0].replace(/[0-9_.-]/g, ' ').trim();
      cleanName = userPart
        ? userPart.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : 'Cliente VIP';
    } else {
      cleanName = 'Cliente VIP';
    }

    let cleanPhone = '';
    if (!isEmail) {
      cleanPhone = inputClean;
    } else if (existing?.phone) {
      cleanPhone = existing.phone;
    } else {
      cleanPhone = '(67) 99944-0532';
    }

    const cleanEmail = isEmail ? inputClean : (email?.trim() || existing?.email || '');

    const newUser: UserAccount = {
      id: existing?.id || `usr-${Date.now()}`,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      isLoggedIn: true,
      password: password || undefined,
    };

    setCurrentUser(newUser);

    // Save/update in registeredClients
    setRegisteredClients((prev) => {
      const idx = prev.findIndex(
        (c) =>
          c.id === newUser.id ||
          (cleanPhone && c.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')) ||
          (cleanEmail && c.email?.toLowerCase() === cleanEmail.toLowerCase())
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || copy[idx].email,
        };
        return copy;
      } else {
        const newClient: RegisteredClient = {
          id: newUser.id,
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          createdAt: new Date().toISOString(),
          totalBookings: 0,
          totalSpent: 0,
        };
        return [newClient, ...prev];
      }
    });

    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    } catch (e) {
      console.error(e);
    }

    showToast(`Bem-vindo(a), ${cleanName}!`, 'success', 'Login Salvo no Aparelho');
  };

  const logoutClient = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error(e);
    }
    showToast('Você saiu da sua conta.', 'info');
  };

  // Reviews & Barber Rating & Moderation
  const addReview = (newReviewData: Omit<BarberReview, 'id' | 'createdAt'>) => {
    const newReview: BarberReview = {
      ...newReviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      hidden: false,
    };
    setReviews((prev) => [newReview, ...prev]);

    // Send admin notification
    const newNotif: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: `Nova Avaliação: ${newReview.rating} Estrelas ⭐`,
      message: `${newReview.clientName} avaliou o serviço ${newReview.serviceName || 'Estúdio VIP'}: "${newReview.comment.substring(0, 60)}..."`,
      timestamp: 'Agora',
      read: false,
      type: 'novo_agendamento',
      appointmentId: newReview.appointmentId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    showToast('Sua avaliação foi enviada com sucesso! Muito obrigado pelo feedback.', 'success', 'Avaliação Registrada');
  };

  const deleteReview = (reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    showToast('Avaliação excluída com sucesso.', 'info', 'Moderação de Avaliação');
  };

  const toggleHideReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextHidden = !r.hidden;
          showToast(
            nextHidden ? 'Avaliação ocultada do público.' : 'Avaliação visível publicamente novamente.',
            'info',
            'Moderação'
          );
          return { ...r, hidden: nextHidden };
        }
        return r;
      })
    );
  };

  const replyToReview = (reviewId: string, replyText: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            ownerReply: replyText.trim(),
            ownerRepliedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );
    showToast('Resposta do barbeiro publicada com sucesso!', 'success', 'Resposta Enviada');
  };

  const getBarberRatingStats = () => {
    // Only calculate score based on publicly visible reviews
    const visibleReviews = reviews.filter((r) => !r.hidden);
    if (visibleReviews.length === 0) {
      return {
        average: 5.0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const sum = visibleReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / visibleReviews.length).toFixed(1));
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    visibleReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      distribution[star] = (distribution[star] || 0) + 1;
    });
    return {
      average: avg,
      count: visibleReviews.length,
      distribution
    };
  };

  // Demo Helpers & Data Reset
  const resetToDefaults = () => {
    setServices(initialServices);
    setSettings(initialSettings);
    setAppointments(initialAppointments);
    setAnnouncements(initialAnnouncements);
    setNotifications(initialNotifications);
    setReviews(initialReviews);
    setRegisteredClients(defaultClients);
    setIsSystemCleaned(false);
    localStorage.removeItem('estudiovip_clean_state_active');
    localStorage.clear();
    showToast('Dados restaurados para o padrão original da barbearia!', 'info', 'Reset Completo');
  };

  /**
   * Cleans all temporary test appointments, mock reviews, and simulation notifications.
   * Keeps intact: All services, prices, photos, working hours, 10 min tolerance rule,
   * PIX settings, and admin panel authentication!
   */
  const resetTestData = () => {
    // Apaga todos os agendamentos da tabela 'appointments' no Supabase
    deleteAllAppointmentsFromSupabase();

    setAppointments([]);
    setReviews([]);
    setNotifications([]);
    setIsSystemCleaned(true);
    const legacyKeys = [
      'estudiovip_appointments_v9',
      'estudiovip_appointments_v8',
      'estudiovip_appointments_v7',
      'estudiovip_appointments_v6',
      'estudiovip_appointments',
      'estudio_vip_appointments',
    ];
    legacyKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem('estudiovip_clean_state_active', 'true');
    showToast(
      'Dados de teste limpos com sucesso! Agendamentos removidos do Supabase e avaliações simuladas apagadas. Seus serviços, preços, regras e expediente permanecem 100% intactos.',
      'success',
      'Sistema Zerado para Clientes Reais'
    );
  };

  const simulateIncomingBooking = () => {
    const randomNames = ['Guilherme Arantes', 'Bruno Guimarães', 'Renato Castilho', 'Carlos Eduardo'];
    const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
    const chosenService = services[Math.floor(Math.random() * services.length)];
    const availableSlots = getAvailableSlots(getTodayString()).filter((s) => s.isAvailable);

    if (availableSlots.length === 0) {
      showToast('Agenda de hoje já está cheia para simulação!', 'warning');
      return;
    }

    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    createAppointment({
      serviceId: chosenService.id,
      clientName: chosenName,
      clientPhone: '(67) 9' + Math.floor(10000000 + Math.random() * 90000000),
      clientEmail: `${chosenName.toLowerCase().replace(' ', '.')}@email.com`,
      date: getTodayString(),
      time: randomSlot.time,
      paymentType: Math.random() > 0.5 ? 'antecipado' : 'presencial',
      paymentMethod: 'pix',
      notes: 'Simulação gerada para teste em tempo real',
    });
  };

  return (
    <BarbershopContext.Provider
      value={{
        services,
        settings,
        appointments,
        announcements,
        notifications,
        reviews,
        currentUser,
        registeredClients,
        isAdminLoggedIn,
        isSupabaseConnected,
        refreshSupabaseAppointments,
        supabaseNotifications,
        activeSupabaseNotifications,
        sendBarberAnnouncement,
        deleteBarberAnnouncement,
        refreshSupabaseNotifications,
        activeView,
        clientActiveTab,
        adminActiveTab,
        toasts,
        adminLogin,
        adminLogout,
        deleteRegisteredClient,
        addOrUpdateRegisteredClient,
        setActiveView,
        setClientActiveTab,
        setAdminActiveTab,
        showToast,
        removeToast,
        isOpenNow,
        setManualBarbershopStatus,
        getAvailableSlots,
        toggleSlotBlocked,
        blockMultipleSlots,
        unblockMultipleSlots,
        unblockAllSlotsForDate,
        blockAllSlotsForDate,
        toggleLunchSlotUnlocked,
        togglePastSlotUnlocked,
        addCustomSlot,
        removeCustomSlot,
        setSlotIntervalMinutes,
        isSlotBlockedByOwner,
        isSlotLunchUnlocked,
        createAppointment,
        cancelAppointment,
        simulateDelayAndCancel,
        checkInAppointment,
        completeAppointment,
        registerPayment,
        addService,
        updateService,
        deleteService,
        updateSettings,
        updateWorkingDay,
        addAnnouncement,
        deleteAnnouncement,
        toggleAnnouncement,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        loginClient,
        logoutClient,
        isAuthModalOpen,
        setAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        resetToDefaults,
        resetTestData,
        isSystemCleaned,
        simulateIncomingBooking,
        addReview,
        deleteReview,
        toggleHideReview,
        replyToReview,
        getBarberRatingStats,
      }}
    >
      {children}
    </BarbershopContext.Provider>
  );
};

export const useBarbershop = (): BarbershopContextType => {
  const context = useContext(BarbershopContext);
  if (!context) {
    throw new Error('useBarbershop must be used within a BarbershopProvider');
  }
  return context;
};
