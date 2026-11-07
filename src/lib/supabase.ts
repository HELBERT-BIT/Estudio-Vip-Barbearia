import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Appointment } from '../types';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://cmjrsttgfbjksxsyntf.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_yRBVu-ie0l8esp4x0D00iQ_I7GWbS1H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Transforms an Appointment domain object to a Supabase table row.
 * Handles both snake_case and camelCase to fit any table schema in PostgreSQL.
 */
export function toSupabaseRow(apt: Appointment): Record<string, unknown> {
  return {
    id: apt.id,
    client_name: apt.clientName,
    client_phone: apt.clientPhone,
    client_email: apt.clientEmail || null,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    service_price: apt.servicePrice,
    service_duration: apt.serviceDuration,
    services: apt.services || null,
    service_ids: apt.serviceIds || null,
    date: apt.date,
    time: apt.time,
    tolerance_expiry_time: apt.toleranceExpiryTime,
    payment_type: apt.paymentType,
    payment_method: apt.paymentMethod,
    payment_status: apt.paymentStatus,
    deposit_amount: apt.depositAmount ?? 0,
    remaining_amount: apt.remainingAmount ?? 0,
    remaining_payment_method: apt.remainingPaymentMethod || null,
    status: apt.status,
    cancellation_reason: apt.cancellationReason || null,
    cancelled_at: apt.cancelledAt || null,
    created_at: apt.createdAt || new Date().toISOString(),
    checked_in_at: apt.checkedInAt || null,
    completed_at: apt.completedAt || null,
    notes: apt.notes || null,
  };
}

/**
 * Transforms a Supabase row (supports both snake_case and camelCase) to an Appointment object.
 */
export function fromSupabaseRow(row: Record<string, any>): Appointment {
  return {
    id: String(row.id),
    clientName: row.client_name ?? row.clientName ?? row.name ?? 'Cliente',
    clientPhone: row.client_phone ?? row.clientPhone ?? row.phone ?? '',
    clientEmail: row.client_email ?? row.clientEmail ?? row.email ?? undefined,
    serviceId: row.service_id ?? row.serviceId ?? 'srv-degrade-fade',
    serviceName: row.service_name ?? row.serviceName ?? 'Corte Degradê Fade',
    servicePrice: Number(row.service_price ?? row.servicePrice ?? 35),
    serviceDuration: Number(row.service_duration ?? row.serviceDuration ?? 30),
    services: Array.isArray(row.services) ? row.services : undefined,
    serviceIds: Array.isArray(row.service_ids)
      ? row.service_ids
      : Array.isArray(row.serviceIds)
      ? row.serviceIds
      : undefined,
    date: row.date || new Date().toISOString().slice(0, 10),
    time: row.time || '09:00',
    toleranceExpiryTime: row.tolerance_expiry_time ?? row.toleranceExpiryTime ?? '09:10',
    paymentType: row.payment_type ?? row.paymentType ?? 'presencial',
    paymentMethod: row.payment_method ?? row.paymentMethod ?? 'pix',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'pendente',
    depositAmount:
      row.deposit_amount !== undefined && row.deposit_amount !== null
        ? Number(row.deposit_amount)
        : row.depositAmount !== undefined
        ? Number(row.depositAmount)
        : undefined,
    remainingAmount:
      row.remaining_amount !== undefined && row.remaining_amount !== null
        ? Number(row.remaining_amount)
        : row.remainingAmount !== undefined
        ? Number(row.remainingAmount)
        : undefined,
    remainingPaymentMethod: row.remaining_payment_method ?? row.remainingPaymentMethod ?? undefined,
    status: row.status || 'agendado',
    cancellationReason: row.cancellation_reason ?? row.cancellationReason ?? undefined,
    cancelledAt: row.cancelled_at ?? row.cancelledAt ?? undefined,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    checkedInAt: row.checked_in_at ?? row.checkedInAt ?? undefined,
    completedAt: row.completed_at ?? row.completedAt ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export const BARBERSHOP_STATUS_DOC_ID = 'system_barbershop_status';

export interface BarbershopGlobalStatus {
  manualOverrideStatus: 'open' | 'closed' | 'auto';
  blockedSlotsByDate?: Record<string, string[]>;
  customUnlockedSlotsByDate?: Record<string, string[]>;
  updatedAt?: string;
}

/**
 * Checks if a row in the appointments table is the special system status record
 */
export function isBarbershopStatusRow(row: Record<string, any>): boolean {
  if (!row) return false;
  return (
    String(row.id) === BARBERSHOP_STATUS_DOC_ID ||
    row.client_name === 'CONFIGURACAO_SISTEMA' ||
    row.service_name === 'STATUS_BARBEARIA'
  );
}

/**
 * Parses the barbershop status record from the Supabase row
 */
export function parseBarbershopStatusFromRow(row: Record<string, any>): BarbershopGlobalStatus {
  let notesData: any = {};
  if (row.notes) {
    try {
      notesData = typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes;
    } catch {
      notesData = {};
    }
  }

  const rawStatus = (row.status || notesData.manualOverrideStatus || 'auto') as string;
  const manualOverrideStatus: 'open' | 'closed' | 'auto' =
    rawStatus === 'open' || rawStatus === 'closed' ? rawStatus : 'auto';

  return {
    manualOverrideStatus,
    blockedSlotsByDate: notesData.blockedSlotsByDate || {},
    customUnlockedSlotsByDate: notesData.customUnlockedSlotsByDate || {},
    updatedAt: notesData.updatedAt || row.created_at || new Date().toISOString(),
  };
}

/**
 * Saves the barbershop open/closed status and schedule slot blocks directly in Supabase
 */
export async function saveBarbershopStatusToSupabase(
  statusData: BarbershopGlobalStatus
): Promise<boolean> {
  try {
    const payload = {
      id: BARBERSHOP_STATUS_DOC_ID,
      client_name: 'CONFIGURACAO_SISTEMA',
      client_phone: '00000000000',
      client_email: null,
      service_id: 'sys-status',
      service_name: 'STATUS_BARBEARIA',
      service_price: 0,
      service_duration: 0,
      date: '2099-12-31',
      time: '00:00',
      tolerance_expiry_time: '00:00',
      payment_type: 'presencial',
      payment_method: 'pix',
      payment_status: 'pago',
      status: statusData.manualOverrideStatus,
      notes: JSON.stringify({
        manualOverrideStatus: statusData.manualOverrideStatus,
        blockedSlotsByDate: statusData.blockedSlotsByDate || {},
        customUnlockedSlotsByDate: statusData.customUnlockedSlotsByDate || {},
        updatedAt: new Date().toISOString(),
      }),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('appointments').upsert([payload]);
    if (error) {
      console.warn('Erro ao salvar status da barbearia no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao salvar status da barbearia no Supabase:', err);
    return false;
  }
}

/**
 * Fetch all appointments AND barbershop status together from Supabase
 */
export async function fetchAppointmentsAndStatusFromSupabase(): Promise<{
  appointments: Appointment[];
  statusConfig: BarbershopGlobalStatus | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.warn('Supabase fetchAppointments error:', error.message || error);
      return null;
    }

    if (!data) return { appointments: [], statusConfig: null };

    let statusConfig: BarbershopGlobalStatus | null = null;
    const clientAppointments: Appointment[] = [];

    for (const row of data) {
      if (isBarbershopStatusRow(row)) {
        statusConfig = parseBarbershopStatusFromRow(row);
      } else {
        clientAppointments.push(fromSupabaseRow(row));
      }
    }

    return { appointments: clientAppointments, statusConfig };
  } catch (err) {
    console.warn('Network error reaching Supabase:', err);
    return null;
  }
}

/**
 * Fetch all client appointments from Supabase (filtering out internal system rows)
 */
export async function fetchAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  const res = await fetchAppointmentsAndStatusFromSupabase();
  return res ? res.appointments : null;
}

/**
 * Insert appointment into Supabase
 */
export async function insertAppointmentToSupabase(apt: Appointment): Promise<boolean> {
  try {
    const row = toSupabaseRow(apt);
    const { error } = await supabase.from('appointments').insert([row]);
    if (error) {
      console.warn('Supabase insertAppointment error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error inserting appointment to Supabase:', err);
    return false;
  }
}

/**
 * Update appointment in Supabase using the exact snake_case columns
 */
export async function updateAppointmentInSupabase(
  id: string,
  updates: Partial<Appointment>
): Promise<boolean> {
  try {
    const patch: Record<string, any> = {};

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.paymentStatus !== undefined) patch.payment_status = updates.paymentStatus;
    if (updates.paymentMethod !== undefined) patch.payment_method = updates.paymentMethod;
    if (updates.checkedInAt !== undefined) patch.checked_in_at = updates.checkedInAt;
    if (updates.completedAt !== undefined) patch.completed_at = updates.completedAt;
    if (updates.cancelledAt !== undefined) patch.cancelled_at = updates.cancelledAt;
    if (updates.cancellationReason !== undefined) patch.cancellation_reason = updates.cancellationReason;
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.time !== undefined) patch.time = updates.time;
    if (updates.toleranceExpiryTime !== undefined) patch.tolerance_expiry_time = updates.toleranceExpiryTime;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.depositAmount !== undefined) patch.deposit_amount = updates.depositAmount;
    if (updates.remainingAmount !== undefined) patch.remaining_amount = updates.remainingAmount;
    if (updates.remainingPaymentMethod !== undefined) patch.remaining_payment_method = updates.remainingPaymentMethod;

    const { error } = await supabase.from('appointments').update(patch).eq('id', id);
    if (error) {
      console.warn('Supabase updateAppointment error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error updating appointment in Supabase:', err);
    return false;
  }
}

/**
 * Delete appointment from Supabase
 */
export async function deleteAppointmentFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteAppointment error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting appointment from Supabase:', err);
    return false;
  }
}

/**
 * Delete all client appointments from Supabase (used when resetting test data),
 * keeping the system barbershop status row intact.
 */
export async function deleteAllAppointmentsFromSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .neq('id', BARBERSHOP_STATUS_DOC_ID);
    if (error) {
      console.warn('Supabase deleteAllAppointments error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting all appointments from Supabase:', err);
    return false;
  }
}

/**
 * Subscribes to Realtime appointment AND barbershop status changes from Supabase.
 * Notifies callbacks whenever an appointment or the shop status is modified.
 */
export function subscribeToAppointmentsRealtime(
  onInsert: (appointment: Appointment) => void,
  onUpdate: (appointment: Appointment) => void,
  onDelete: (id: string) => void,
  onStatusChange?: (status: string) => void,
  onBarbershopStatusChange?: (statusConfig: BarbershopGlobalStatus) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('realtime_appointments_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          // If the changed row is the system barbershop status row
          const candidateRow = (payload.new && Object.keys(payload.new).length > 0)
            ? payload.new
            : payload.old;

          if (candidateRow && isBarbershopStatusRow(candidateRow)) {
            if (payload.new && onBarbershopStatusChange) {
              const statusConfig = parseBarbershopStatusFromRow(payload.new);
              onBarbershopStatusChange(statusConfig);
            }
            return;
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onInsert(apt);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onUpdate(apt);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = payload.old.id ? String(payload.old.id) : '';
            if (id && id !== BARBERSHOP_STATUS_DOC_ID) {
              onDelete(id);
            }
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status);
        }
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Conectado ao Supabase Realtime (Agendamentos e Status ao vivo)!');
        }
      });
  } catch (err) {
    console.warn('Could not establish Supabase Realtime channel:', err);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
