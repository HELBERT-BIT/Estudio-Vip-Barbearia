export type ServiceCategory = 'cabelo' | 'barba' | 'sobrancelha' | 'geral';

export interface BarberService {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: ServiceCategory;
  active: boolean;
  popular?: boolean;
  imageUrl?: string;
}

export type PaymentType = 'antecipado' | 'presencial' | 'sinal_50';

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'dinheiro';

export type PaymentStatus = 'pendente' | 'sinal_pago' | 'pago' | 'reembolsado';

export type AppointmentStatus = 
  | 'agendado' 
  | 'confirmado_presenca' 
  | 'em_atendimento' 
  | 'concluido' 
  | 'cancelado_cliente' 
  | 'cancelado_atraso' 
  | 'cancelado_barbearia';

export interface AppointmentServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceIds?: string[];
  services?: AppointmentServiceItem[];
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  toleranceExpiryTime: string; // HH:mm (10 min after time)
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  depositAmount?: number; // 50% reservation guarantee
  remainingAmount?: number; // remaining 50% to be paid in person
  remainingPaymentMethod?: PaymentMethod; // chosen in-person payment method
  status: AppointmentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  checkedInAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface WorkingDayConfig {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayName: string;
  active: boolean;
  openTime: string; // HH:mm (08:30)
  closeTime: string; // HH:mm (19:00)
  hasLunchBreak: boolean;
  lunchStart: string; // HH:mm (12:00)
  lunchEnd: string; // HH:mm (14:00)
}

export interface BarbershopSettings {
  name: string;
  tagline: string;
  address: string;
  neighborhood: string;
  city: string;
  referencePoint: string;
  phone: string;
  whatsapp: string;
  barberName: string; // Mariano
  scheduleNotice: string;
  slotDurationMinutes: number; // 30
  toleranceMinutes: number; // 10 minutes
  arrivalGuideline: string; // "Chegue entre 5 e 10 minutos antes do atendimento."
  workingDays: WorkingDayConfig[];
  pixKey: string;
  pixKeyType: string;
  pixKeyFormatted?: string;
  pixReceiverName: string;
  pixBank?: string;
  guaranteePercentage?: number; // 50%
  manualOverrideStatus?: 'auto' | 'open' | 'closed'; // Manual open/close toggle by the owner
  blockedSlotsByDate?: Record<string, string[]>; // Time slots removed/blocked by the owner for specific dates
  customUnlockedSlotsByDate?: Record<string, string[]>; // Slots explicitly opened by the owner (e.g. during lunch)
  customExtraSlotsByDate?: Record<string, string[]>; // Custom specific slots created by the owner (e.g. 17:10, 17:20)
  slotIntervalMinutes?: number; // 15, 20, 30, 45, 60 min intervals
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  badge: 'Aviso' | 'Novidade' | 'Horário' | 'Informação';
  date: string;
  active: boolean;
  important?: boolean;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'novo_agendamento' | 'cancelamento_atraso' | 'cancelamento_cliente' | 'pagamento_confirmado';
  appointmentId?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  isLoggedIn: boolean;
  password?: string;
}

export interface BarberReview {
  id: string;
  appointmentId?: string;
  clientName: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName?: string;
  rating: number; // 1 to 5
  comment: string;
  tags?: string[];
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
  barberName: string; // 'Mariano'
  hidden?: boolean; // Moderation: hidden from public by owner
  ownerReply?: string; // Moderation: official reply by Mariano
  ownerRepliedAt?: string;
}
