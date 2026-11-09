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
 * Checks if a client already exists in the 'client' table in Supabase (by phone or email),
 * and if not, automatically inserts them using supabase.from('client').insert(...)
 * 
 * Target table: 'client' (singular)
 * Expected columns: name, phone, email
 */
export async function insertClientIfNotExistsToSupabase(clientData: {
  name: string;
  phone: string;
  email?: string;
}): Promise<boolean> {
  const clientName = (clientData.name || '').trim();
  const cleanPhone = (clientData.phone || '').trim();
  const rawDigits = cleanPhone.replace(/\D/g, '');
  const cleanEmail = (clientData.email || '').trim().toLowerCase();

  console.log('🔍 [insertClientIfNotExistsToSupabase] Verificando dados para inserção na tabela client:', {
    name: clientName,
    phone: cleanPhone,
    rawDigits,
    email: cleanEmail || '(não informado)',
  });

  if (!clientName && !cleanPhone && !cleanEmail) {
    console.error('❌ [insertClientIfNotExistsToSupabase] Abortado: nome, telefone e email estão vazios.');
    return false;
  }

  try {
    let clientExists = false;
    let existingRecord: any = null;

    // 1. Verificação segura se o cliente já existe na tabela 'client'
    // Consultas separadas e limpas para evitar erros de sintaxe no parser PostgREST com parênteses ou traços
    try {
      if (cleanPhone) {
        const { data: byPhone, error: phoneErr } = await supabase
          .from('client')
          .select('id, name, phone, email')
          .eq('phone', cleanPhone)
          .limit(1);

        if (phoneErr) {
          console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por phone formatado:', {
            message: phoneErr.message,
            code: phoneErr.code,
            details: phoneErr.details,
            hint: phoneErr.hint,
          });
        } else if (byPhone && byPhone.length > 0) {
          clientExists = true;
          existingRecord = byPhone[0];
        }

        // Se não encontrou pelo formato com máscara, tenta pelos dígitos puros
        if (!clientExists && rawDigits && rawDigits !== cleanPhone) {
          const { data: byDigits, error: digitsErr } = await supabase
            .from('client')
            .select('id, name, phone, email')
            .eq('phone', rawDigits)
            .limit(1);

          if (digitsErr) {
            console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por phone dígitos:', {
              message: digitsErr.message,
              code: digitsErr.code,
            });
          } else if (byDigits && byDigits.length > 0) {
            clientExists = true;
            existingRecord = byDigits[0];
          }
        }
      }

      // Se não encontrou por telefone e tem e-mail, busca por e-mail
      if (!clientExists && cleanEmail) {
        const { data: byEmail, error: emailErr } = await supabase
          .from('client')
          .select('id, name, phone, email')
          .ilike('email', cleanEmail)
          .limit(1);

        if (emailErr) {
          console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por e-mail:', {
            message: emailErr.message,
            code: emailErr.code,
          });
        } else if (byEmail && byEmail.length > 0) {
          clientExists = true;
          existingRecord = byEmail[0];
        }
      }
    } catch (checkEx) {
      console.error('❌ [insertClientIfNotExistsToSupabase] Exceção durante a checagem prévia na tabela client:', checkEx);
    }

    if (clientExists) {
      console.log(`ℹ️ [insertClientIfNotExistsToSupabase] Cliente já existe na tabela 'client' do Supabase:`, existingRecord);
      return true;
    }

    // 2. Cliente NÃO existe: Montar objeto estritamente com as colunas da tabela: (name, phone, email)
    // Sem campos extras para evitar erro de coluna inexistente no PostgreSQL
    const clientPayload: {
      name: string;
      phone: string;
      email: string | null;
    } = {
      name: clientName,
      phone: cleanPhone,
      email: cleanEmail ? cleanEmail : null,
    };

    console.log('🚀 [insertClientIfNotExistsToSupabase] Executando supabase.from(\'client\').insert(...) com payload exato:', clientPayload);

    const { data: insertResult, error: insertError } = await supabase
      .from('client')
      .insert([clientPayload])
      .select();

    if (insertError) {
      console.error('❌ [insertClientIfNotExistsToSupabase] FALHA AO INSERIR CLIENTE NA TABELA client:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        payloadEnviado: clientPayload,
      });

      // Tentativa de contingência 1: Se a tabela tiver colunas em português (nome, telefone, email)
      if (insertError.message && (insertError.message.includes('column') || insertError.code === '42703')) {
        console.warn('⚠️ [insertClientIfNotExistsToSupabase] Tentando fallback para colunas em português (nome, telefone, email)...');
        const ptPayload = {
          nome: clientName,
          telefone: cleanPhone,
          email: cleanEmail ? cleanEmail : null,
        };
        const { data: ptResult, error: ptError } = await supabase
          .from('client')
          .insert([ptPayload])
          .select();

        if (ptError) {
          console.error('❌ [insertClientIfNotExistsToSupabase] Fallback em português também falhou:', {
            message: ptError.message,
            details: ptError.details,
            hint: ptError.hint,
            code: ptError.code,
            payloadEnviado: ptPayload,
          });
          return false;
        }

        console.log('✅ [insertClientIfNotExistsToSupabase] Sucesso via fallback na tabela client:', ptResult);
        return true;
      }

      return false;
    }

    console.log('✅ [insertClientIfNotExistsToSupabase] Cliente inserido com SUCESSO na tabela client:', insertResult);
    return true;
  } catch (err) {
    console.error('❌ [insertClientIfNotExistsToSupabase] Exceção inesperada na rotina de cadastro de cliente:', err);
    return false;
  }
}

/**
 * Fetches clients from the 'client' table in Supabase
 */
export async function fetchClientsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .limit(500);

    if (error) {
      console.error('❌ [fetchClientsFromSupabase] Erro ao consultar tabela client:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    return data || [];
  } catch (err) {
    console.error('❌ [fetchClientsFromSupabase] Exceção de rede ao buscar clientes no Supabase:', err);
    return null;
  }
}

/**
 * Insert appointment into Supabase and automatically register client in 'client' table (with await)
 */
export async function insertAppointmentToSupabase(apt: Appointment): Promise<boolean> {
  try {
    // 1. Garantir que os dados do cliente sejam inseridos primeiro na tabela 'client' usando AWAIT
    if (apt.clientName && (apt.clientPhone || apt.clientEmail)) {
      try {
        console.log(`💈 [insertAppointmentToSupabase] Executando AWAIT para cadastrar cliente "${apt.clientName}" na tabela 'client'...`);
        const clientSaved = await insertClientIfNotExistsToSupabase({
          name: apt.clientName,
          phone: apt.clientPhone,
          email: apt.clientEmail,
        });
        console.log(`💈 [insertAppointmentToSupabase] Resultado da gravação do cliente: ${clientSaved ? 'SUCESSO' : 'ATENÇÃO'}`);
      } catch (clientErr) {
        console.error('❌ [insertAppointmentToSupabase] Exceção no AWAIT do insertClientIfNotExistsToSupabase:', clientErr);
      }
    }

    // 2. Inserir o agendamento na tabela 'appointments'
    const row = toSupabaseRow(apt);
    console.log(`💈 [insertAppointmentToSupabase] Gravando agendamento ${apt.id} em appointments...`);
    const { data, error } = await supabase.from('appointments').insert([row]).select();
    if (error) {
      console.error('❌ [insertAppointmentToSupabase] Erro ao gravar agendamento em appointments:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }
    console.log(`✅ [insertAppointmentToSupabase] Agendamento ${apt.id} gravado com sucesso!`, data);
    return true;
  } catch (err) {
    console.error('❌ [insertAppointmentToSupabase] Exceção geral ao gravar agendamento:', err);
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

/**
 * Interface representing a notification row in Supabase 'notifications' table
 */
export interface SupabaseNotification {
  id: string | number;
  title: string;
  message: string;
  type?: string;
  created_at?: string;
}

/**
 * Normalizes rows from the notifications table (handling potential Portuguese or alternate column names)
 */
export function normalizeNotificationRow(row: Record<string, any>): SupabaseNotification {
  return {
    id: row.id ?? `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: row.title ?? row.titulo ?? 'Aviso da Barbearia',
    message: row.message ?? row.mensagem ?? row.content ?? row.texto ?? '',
    type: row.type ?? row.tipo ?? 'aviso',
    created_at: row.created_at ?? row.data ?? new Date().toISOString(),
  };
}

/**
 * Sends/inserts a new notification/announcement into Supabase 'notifications' table.
 * All connected clients receive it instantly via Supabase Realtime.
 */
export async function sendNotificationToSupabase(notif: {
  title: string;
  message: string;
  type?: string;
}): Promise<SupabaseNotification | null> {
  const title = (notif.title || '').trim();
  const message = (notif.message || '').trim();
  const type = (notif.type || 'aviso').trim();

  if (!title || !message) {
    console.error('❌ [sendNotificationToSupabase] Título e mensagem são obrigatórios.');
    return null;
  }

  try {
    console.log('🚀 [sendNotificationToSupabase] Inserindo aviso na tabela notifications:', { title, message, type });

    // Tentativa 1: Colunas padrão em inglês (title, message, type, created_at)
    const payload = {
      title,
      message,
      type,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select();

    if (!error && data && data.length > 0) {
      const inserted = normalizeNotificationRow(data[0]);
      console.log('✅ [sendNotificationToSupabase] Aviso gravado com sucesso no Supabase:', inserted);
      return inserted;
    }

    if (error) {
      console.warn('⚠️ [sendNotificationToSupabase] Tentativa padrão falhou, testando variações de esquema:', error.message);

      // Fallback 1: se as colunas forem em português (titulo, mensagem, tipo)
      if (error.message && (error.message.includes('column') || error.code === '42703')) {
        const ptPayload = {
          titulo: title,
          mensagem: message,
          tipo: type,
          created_at: new Date().toISOString(),
        };
        const { data: ptData, error: ptError } = await supabase
          .from('notifications')
          .insert([ptPayload])
          .select();

        if (!ptError && ptData && ptData.length > 0) {
          const inserted = normalizeNotificationRow(ptData[0]);
          console.log('✅ [sendNotificationToSupabase] Gravado com sucesso (esquema PT):', inserted);
          return inserted;
        }

        // Fallback 2: coluna content em vez de message
        const contentPayload = {
          title,
          content: message,
          type,
          created_at: new Date().toISOString(),
        };
        const { data: cData, error: cError } = await supabase
          .from('notifications')
          .insert([contentPayload])
          .select();

        if (!cError && cData && cData.length > 0) {
          const inserted = normalizeNotificationRow(cData[0]);
          console.log('✅ [sendNotificationToSupabase] Gravado com sucesso (esquema content):', inserted);
          return inserted;
        }

        // Fallback 3: payload simples apenas com title e message (sem created_at)
        const simplePayload = {
          title,
          message,
        };
        const { data: sData, error: sError } = await supabase
          .from('notifications')
          .insert([simplePayload])
          .select();

        if (!sError && sData && sData.length > 0) {
          const inserted = normalizeNotificationRow(sData[0]);
          console.log('✅ [sendNotificationToSupabase] Gravado com sucesso (esquema simples):', inserted);
          return inserted;
        }

        console.error('❌ [sendNotificationToSupabase] Todas as tentativas falharam:', {
          original: error,
          ptError,
          cError,
          sError,
        });
        return null;
      }

      console.error('❌ [sendNotificationToSupabase] Erro ao gravar aviso na tabela notifications:', error);
      return null;
    }

    return null;
  } catch (err) {
    console.error('❌ [sendNotificationToSupabase] Exceção inesperada:', err);
    return null;
  }
}

/**
 * Fetches the most recent notifications from the 'notifications' table
 */
export async function fetchNotificationsFromSupabase(): Promise<SupabaseNotification[] | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      // Fallback sem ordenação de created_at caso o nome da coluna de data seja diferente
      const { data: fbData, error: fbError } = await supabase
        .from('notifications')
        .select('*')
        .limit(30);

      if (fbError) {
        console.warn('⚠️ [fetchNotificationsFromSupabase] Erro ao carregar avisos:', fbError.message);
        return null;
      }
      return (fbData || []).map(normalizeNotificationRow);
    }

    return (data || []).map(normalizeNotificationRow);
  } catch (err) {
    console.warn('⚠️ [fetchNotificationsFromSupabase] Exceção de rede:', err);
    return null;
  }
}

/**
 * Deletes a notification from the 'notifications' table
 */
export async function deleteNotificationFromSupabase(id: string | number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [deleteNotificationFromSupabase] Erro ao excluir aviso:', error);
      return false;
    }
    console.log(`✅ [deleteNotificationFromSupabase] Aviso ${id} removido com sucesso.`);
    return true;
  } catch (err) {
    console.error('❌ [deleteNotificationFromSupabase] Exceção ao excluir aviso:', err);
    return false;
  }
}

/**
 * Subscribes in Realtime to the 'notifications' table in Supabase.
 * Triggers callback whenever a new notice is inserted or deleted by the barber.
 */
export function subscribeToNotificationsRealtime(
  onInsert: (notification: SupabaseNotification) => void,
  onDelete?: (id: string | number) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('realtime_notifications_feed_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('⚡ [Realtime Notifications Event]', payload.eventType, payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            const notif = normalizeNotificationRow(payload.new);
            onInsert(notif);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            if (onDelete && payload.old.id) {
              onDelete(payload.old.id);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Conectado ao Supabase Realtime (Tabela notifications ativa)!');
        }
      });
  } catch (err) {
    console.warn('⚠️ Erro ao registrar canal Realtime para notifications:', err);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
