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

/**
 * Fetch all appointments from Supabase
 */
export async function fetchAppointmentsFromSupabase(): Promise<Appointment[] | null> {
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

    if (!data) return [];
    return data.map(fromSupabaseRow);
  } catch (err) {
    console.warn('Network error reaching Supabase:', err);
    return null;
  }
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
      // Try camelCase fallback if table was created with camelCase
      const camelRow = {
        id: apt.id,
        clientName: apt.clientName,
        clientPhone: apt.clientPhone,
        clientEmail: apt.clientEmail || null,
        serviceId: apt.serviceId,
        serviceName: apt.serviceName,
        servicePrice: apt.servicePrice,
        serviceDuration: apt.serviceDuration,
        services: apt.services || null,
        serviceIds: apt.serviceIds || null,
        date: apt.date,
        time: apt.time,
        toleranceExpiryTime: apt.toleranceExpiryTime,
        paymentType: apt.paymentType,
        paymentMethod: apt.paymentMethod,
        paymentStatus: apt.paymentStatus,
        depositAmount: apt.depositAmount ?? 0,
        remainingAmount: apt.remainingAmount ?? 0,
        remainingPaymentMethod: apt.remainingPaymentMethod || null,
        status: apt.status,
        cancellationReason: apt.cancellationReason || null,
        cancelledAt: apt.cancelledAt || null,
        createdAt: apt.createdAt || new Date().toISOString(),
        checkedInAt: apt.checkedInAt || null,
        completedAt: apt.completedAt || null,
        notes: apt.notes || null,
      };
      const fallback = await supabase.from('appointments').insert([camelRow]);
      if (fallback.error) {
        console.warn('Supabase insert fallback also failed:', fallback.error.message);
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Network error inserting appointment to Supabase:', err);
    return false;
  }
}

/**
 * Update appointment in Supabase
 */
export async function updateAppointmentInSupabase(
  id: string,
  updates: Partial<Appointment>
): Promise<boolean> {
  try {
    const patch: Record<string, any> = {};

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.paymentStatus !== undefined) {
      patch.payment_status = updates.paymentStatus;
      patch.paymentStatus = updates.paymentStatus;
    }
    if (updates.paymentMethod !== undefined) {
      patch.payment_method = updates.paymentMethod;
      patch.paymentMethod = updates.paymentMethod;
    }
    if (updates.checkedInAt !== undefined) {
      patch.checked_in_at = updates.checkedInAt;
      patch.checkedInAt = updates.checkedInAt;
    }
    if (updates.completedAt !== undefined) {
      patch.completed_at = updates.completedAt;
      patch.completedAt = updates.completedAt;
    }
    if (updates.cancelledAt !== undefined) {
      patch.cancelled_at = updates.cancelledAt;
      patch.cancelledAt = updates.cancelledAt;
    }
    if (updates.cancellationReason !== undefined) {
      patch.cancellation_reason = updates.cancellationReason;
      patch.cancellationReason = updates.cancellationReason;
    }
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.time !== undefined) patch.time = updates.time;
    if (updates.toleranceExpiryTime !== undefined) {
      patch.tolerance_expiry_time = updates.toleranceExpiryTime;
      patch.toleranceExpiryTime = updates.toleranceExpiryTime;
    }
    if (updates.notes !== undefined) patch.notes = updates.notes;

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
 * Subscribes to Realtime appointment changes from Supabase.
 * Notifies the callback whenever an appointment is INSERTed, UPDATEd, or DELETEd.
 */
export function subscribeToAppointmentsRealtime(
  onInsert: (appointment: Appointment) => void,
  onUpdate: (appointment: Appointment) => void,
  onDelete: (id: string) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onInsert(apt);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onUpdate(apt);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'appointments' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(String(payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Conectado ao Supabase Realtime (Agendamentos ao vivo)!');
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
